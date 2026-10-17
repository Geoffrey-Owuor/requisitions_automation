// Network resilience for the Microsoft Entra ID SSO callback.
import { ArcticFetchError } from "arctic";

// Error codes meaning the TCP/TLS connection was never established, so the
// request never reached Microsoft. These are the only failures safe to retry
// for the authorization-code exchange: a code is single-use, and one that
// failed mid-request (e.g. ECONNRESET) may already have been redeemed.
const CONNECT_FAILURE_CODES = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ENETUNREACH",
  "EHOSTUNREACH",
]);

// Walks the cause chain (ArcticFetchError -> TypeError "fetch failed" ->
// undici/net error, possibly an AggregateError from multi-address connects).
export function isConnectFailure(error: unknown): boolean {
  const seen = new Set<unknown>();
  const stack: unknown[] = [error];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const { code, syscall, cause, errors } = current as {
      code?: unknown;
      syscall?: unknown;
      cause?: unknown;
      errors?: unknown;
    };
    if (
      typeof code === "string" &&
      (CONNECT_FAILURE_CODES.has(code) ||
        (code === "ETIMEDOUT" && syscall === "connect"))
    ) {
      return true;
    }
    if (cause) stack.push(cause);
    if (Array.isArray(errors)) stack.push(...errors);
  }
  return false;
}

// Any failure to talk to Microsoft at all (connect failure, reset, timeout),
// as opposed to Microsoft answering with an error. Used to tell the user
// "try again" rather than "sign-in failed".
export function isMicrosoftUnreachable(error: unknown): boolean {
  return (
    error instanceof ArcticFetchError ||
    isConnectFailure(error) ||
    (error instanceof TypeError && error.message === "fetch failed") ||
    (error instanceof Error && error.name === "TimeoutError")
  );
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Retries `fn` once, only when the connection never opened - safe for the
// single-use authorization-code exchange.
export async function retryOnConnectFailure<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isConnectFailure(error)) throw error;
    console.warn(`${label}: could not connect to Microsoft, retrying once...`);
    await sleep(1000);
    return fn();
  }
}

const USERINFO_TIMEOUT_MS = 10_000;

export class MicrosoftProfileError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.retryable = retryable;
  }
}

export type MicrosoftProfile = {
  name?: string;
  email?: string;
  preferred_username?: string;
};

// Fetches the signed-in user's OIDC profile. Unlike the code exchange this is
// a read-only GET, so any network failure, timeout or 5xx is retried once.
// Throws MicrosoftProfileError on a non-2xx answer instead of returning
// Graph's error body as if it were a profile.
export async function fetchMicrosoftProfile(
  accessToken: string,
): Promise<MicrosoftProfile> {
  const attempt = async () => {
    const response = await fetch("https://graph.microsoft.com/oidc/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(USERINFO_TIMEOUT_MS),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new MicrosoftProfileError(
        `Microsoft userinfo returned ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`,
        response.status >= 500,
      );
    }
    return (await response.json()) as MicrosoftProfile;
  };

  try {
    return await attempt();
  } catch (error) {
    const retryable =
      isMicrosoftUnreachable(error) ||
      (error instanceof MicrosoftProfileError && error.retryable);
    if (!retryable) throw error;
    console.warn("Microsoft userinfo request failed, retrying once...");
    await sleep(1000);
    return attempt();
  }
}
