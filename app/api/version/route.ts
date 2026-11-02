// The running build's version, which open tabs compare with their own to offer
// a reload (components/Modules/useUpdateAvailable.ts). Inlined at build time, so
// it always describes the code that's answering. Public, since the alert also
// shows on pages without a session, and it only reveals a commit hash.
export function GET() {
  return Response.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
