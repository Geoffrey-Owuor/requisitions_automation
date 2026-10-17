// Shared Microsoft Graph sendMail transport: app-only token + retries.
// Every sender in services/ builds its Graph message payload and hands it to
// sendGraphMail - don't call the sendMail endpoint directly.
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";
import { createLimiter, sleep } from "@/utils/createLimiter";

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}`,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

// MSAL caches the app token in memory, so this only hits the network when
// the cached token is missing/expiring - but that call can fail on its own
// ("network_error: Network request failed"), so it runs inside the retry loop.
async function getAccessToken() {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return result?.accessToken;
}

// --- RESILIENCE SETTINGS ---
// Exchange Online allows ~4 concurrent requests per mailbox per app, and PM2
// runs several workers, so each worker only sends a couple at a time. The
// rest queue instead of all hitting Graph (and the uplink) at once.
const graphLimit = createLimiter(2);
const MAX_ATTEMPTS = 4;
const ATTEMPT_TIMEOUT_MS = 30_000;
const MAX_RETRY_AFTER_MS = 60_000;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

class GraphSendError extends Error {
  retryable: boolean;
  retryAfterMs?: number;

  constructor(
    message: string,
    { retryable, retryAfterMs }: { retryable: boolean; retryAfterMs?: number },
  ) {
    super(message);
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

// Exponential backoff with jitter (~1s, 2s, 4s) so workers that failed
// together don't all retry in the same instant.
const backoffMs = (attempt: number) =>
  1000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 1000);

function describeNetworkError(error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError") {
    return `timed out after ${ATTEMPT_TIMEOUT_MS / 1000}s`;
  }
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { cause?: { code?: string } })?.cause?.code;
  return code ? `${message} (${code})` : message;
}

async function sendOnce(from: string, body: string) {
  let accessToken: string | undefined;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    // Token endpoint unreachable - transient, retry.
    throw new GraphSendError(
      `Token request failed: ${describeNetworkError(error)}`,
      { retryable: true },
    );
  }
  if (!accessToken) {
    throw new GraphSendError("Failed to retrieve access token", {
      retryable: true,
    });
  }

  let response: Response;
  try {
    response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${from}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      },
    );
  } catch (error) {
    // "fetch failed" (connect timeout, DNS, reset) or our own timeout.
    throw new GraphSendError(`Network error: ${describeNetworkError(error)}`, {
      retryable: true,
    });
  }

  if (response.ok) return;

  const retryAfter = parseInt(response.headers.get("Retry-After") ?? "", 10);
  const errorData = await response.json().catch(() => ({}));
  throw new GraphSendError(
    errorData.error?.message ||
      `Failed to send email via Graph (Status: ${response.status})`,
    {
      // Anything else (e.g. 400 Bad Request) won't succeed on retry.
      retryable: RETRYABLE_STATUSES.has(response.status),
      retryAfterMs: Number.isFinite(retryAfter)
        ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS)
        : undefined,
    },
  );
}

// Sends a Graph sendMail payload as `from`, retrying throttling (429),
// network failures, timeouts and 5xx with backoff. Throws once retries are
// exhausted or on a non-retryable error - callers turn that into their own
// { success, error } result. A timed-out attempt may still have been
// delivered, so a retry can occasionally produce a duplicate email; that's
// preferred over silently dropping one.
export async function sendGraphMail(
  from: string,
  payload: unknown,
  subject: string,
): Promise<void> {
  const body = JSON.stringify(payload);

  // The limiter slot is only held for the attempt itself, not the backoff
  // wait, so a retrying email doesn't block others in the queue.
  for (let attempt = 1; ; attempt++) {
    try {
      await graphLimit(() => sendOnce(from, body));
      if (attempt > 1) {
        console.info(`Email "${subject}" sent on attempt ${attempt}.`);
      }
      return;
    } catch (error) {
      const sendError =
        error instanceof GraphSendError
          ? error
          : new GraphSendError(
              error instanceof Error ? error.message : "Unknown error",
              { retryable: false },
            );
      if (!sendError.retryable || attempt >= MAX_ATTEMPTS) {
        throw new Error(
          `${sendError.message} (after ${attempt} attempt${attempt > 1 ? "s" : ""})`,
        );
      }
      const waitTime = sendError.retryAfterMs ?? backoffMs(attempt);
      console.warn(
        `Email "${subject}" attempt ${attempt}/${MAX_ATTEMPTS} failed: ${sendError.message}. Retrying in ${(waitTime / 1000).toFixed(1)}s...`,
      );
      await sleep(waitTime);
    }
  }
}
