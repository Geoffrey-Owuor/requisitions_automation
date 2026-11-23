// Values the browser needs. Next.js inlines NEXT_PUBLIC_ variables into the
// client bundle at build time, and only when they're read as literal
// `process.env.NEXT_PUBLIC_...` expressions, so each one is spelled out here.
// Never put a server-only value in this file: everything here ships to every
// visitor. Server values live in lib/config.ts.

const trimmed = (value: string | undefined) => value?.trim() || undefined;

export const publicConfig = {
  // The build's commit SHA, set by next.config.ts from GITHUB_SHA. Empty in
  // local builds, which then never offer an update.
  appVersion: trimmed(process.env.NEXT_PUBLIC_APP_VERSION),

  // The organization's OneDrive (SharePoint "-my") URL for the app launcher.
  // Optional: the OneDrive tile is hidden while unset.
  oneDriveUrl: trimmed(process.env.NEXT_PUBLIC_ONEDRIVE_URL),

  // The staff email domain, used only as an input placeholder hint
  emailPlaceholder: `name@${trimmed(process.env.NEXT_PUBLIC_EMAIL_DOMAIN) ?? "example.com"}`,
};
