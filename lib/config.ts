import "server-only";
import { timingSafeEqual } from "crypto";

// The one place server code reads its environment. Every value is a getter,
// read when first used rather than at import, so a missing variable fails the
// request that needs it with a named error instead of breaking `next build` or
// every unrelated route. Browser-visible values live in lib/publicConfig.ts.
//
// The (untracked) .env.example lists every variable; keep it in step.

export class MissingConfigError extends Error {
  constructor(name: string) {
    super(
      `Missing required environment variable ${name}. Set it in the server's environment (see .env.example).`,
    );
    this.name = "MissingConfigError";
  }
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (value === undefined) throw new MissingConfigError(name);
  return value;
}

function port(name: string, fallback: number): number {
  const raw = optional(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(
      `Environment variable ${name} must be a port number, got "${raw}"`,
    );
  }
  return value;
}

// A required comma-separated list of email addresses. Spaces and empty
// entries are ignored; an entry that isn't an address is dropped with a
// warning rather than failing every send, but at least one must be valid.
const warnedAboutEmailList = new Set<string>();
function emailList(name: string): string[] {
  const entries = required(name)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const valid = entries.filter((entry) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry),
  );
  const invalid = entries.filter((entry) => !valid.includes(entry));
  if (invalid.length > 0 && !warnedAboutEmailList.has(name)) {
    warnedAboutEmailList.add(name);
    console.warn(
      `${name} has entries that aren't email addresses and will be skipped: ${invalid.join(", ")}`,
    );
  }
  if (valid.length === 0) throw new MissingConfigError(name);
  return [...new Set(valid)];
}

let warnedAboutEmailFlag = false;

export const config = {
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },

  // The app's public URL, used for links in emails. Only the server needs it.
  // NEXT_PUBLIC_BASE_URL is the old name, still accepted so a server that
  // hasn't been updated keeps working.
  get appBaseUrl() {
    const value = config.appBaseUrlIfSet;
    if (value === undefined) throw new MissingConfigError("APP_BASE_URL");
    return value;
  },
  get appBaseUrlIfSet() {
    const value = optional("APP_BASE_URL") ?? optional("NEXT_PUBLIC_BASE_URL");
    return value?.replace(/\/+$/, "");
  },

  database: {
    get host() {
      return required("DATABASE_HOST");
    },
    get user() {
      return required("DATABASE_USER");
    },
    get password() {
      return required("DATABASE_PASSWORD");
    },
    get name() {
      return required("DATABASE_NAME");
    },
    get port() {
      return port("DATABASE_PORT", 5432);
    },
  },

  // Microsoft Entra ID app registration: sign-in and Graph mail
  entra: {
    get tenantId() {
      return required("AUTH_MICROSOFT_ENTRA_ID_TENANT_ID");
    },
    get clientId() {
      return required("AUTH_MICROSOFT_ENTRA_ID_ID");
    },
    get clientSecret() {
      return required("AUTH_MICROSOFT_ENTRA_ID_SECRET");
    },
  },

  get sessionSecret() {
    return required("SESSION_SECRET");
  },

  get uploadDirectory() {
    return required("UPLOAD_DIRECTORY");
  },

  // Optional: each feature that uses one refuses its requests while unset
  secrets: {
    get cron() {
      return optional("CRON_SECRET");
    },
    get revalidateTag() {
      return optional("REVALIDATE_TAG_KEY");
    },
    get ssoShared() {
      return optional("SSO_SHARED_SECRET");
    },
    get staffLookupApiKey() {
      return optional("STAFF_LOOKUP_API_KEY");
    },
  },

  email: {
    // Only an explicit "false" (any case) disables sending. Missing or any
    // other value sends, and an unrecognised value logs a warning once.
    get notificationsEnabled() {
      const raw = process.env.NOTIFICATION_EMAILS_ENABLED;
      if (raw === undefined) return true;
      const value = raw.trim().toLowerCase();
      if (value === "false") return false;
      if (value !== "true" && !warnedAboutEmailFlag) {
        warnedAboutEmailFlag = true;
        console.warn(
          `NOTIFICATION_EMAILS_ENABLED has an unrecognised value "${raw}" - emails will be sent. Use "false" to disable them.`,
        );
      }
      return true;
    },
    senders: {
      get default() {
        return required("EMAIL_SENDER");
      },
      get it() {
        return required("IT_EMAIL_SENDER");
      },
      get access() {
        return required("ACCESS_EMAIL_SENDER");
      },
      get advance() {
        return required("ADVANCE_EMAIL_SENDER");
      },
      get casual() {
        return required("CASUAL_EMAIL_SENDER");
      },
      get employee() {
        return required("EMPLOYEE_EMAIL_SENDER");
      },
    },
    recipients: {
      get admin() {
        return required("ADMIN_EMAIL");
      },
      get firstHr() {
        return required("FIRST_HR_EMAIL");
      },
      get secondHr() {
        return required("SECOND_HR_EMAIL");
      },
      get thirdFinance() {
        return required("THIRD_FINANCE_EMAIL");
      },
      // One or more addresses, comma-separated: every one gets the approved
      // casual requisition in a single email
      get externalCasualProviders() {
        return emailList("EXTERNAL_CASUAL_PROVIDER");
      },
    },
  },
};

// Constant-time comparison of a caller-supplied secret with a configured one.
// False while the secret is unset, so an unconfigured endpoint refuses
// everything rather than matching a request that omits it.
export function secretMatches(
  provided: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
