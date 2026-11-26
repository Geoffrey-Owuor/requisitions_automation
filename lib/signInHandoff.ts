import "server-only";
import { HOTPOINT_MARK_PATH } from "@/components/HotpointMark";

// The query parameter that marks the callback's second pass
export const HANDOFF_PARAM = "handoff";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// What app/api/auth/callback answers Microsoft's redirect with: the
// "Signing you in" screen (components/SignInTransition.tsx, redrawn in plain
// HTML and inline CSS so it paints without loading anything), which then
// re-requests the callback with HANDOFF_PARAM to do the code exchange.
// Microsoft's redirect is cross-site, so the browser shows a blank page from
// the moment the next page commits until it paints; this page paints at
// once, and the exchange and the dashboard load after it are same-origin
// navigations, during which the browser keeps it on screen.
export function signInHandoffResponse(target: URL) {
  const href = escapeHtml(target.pathname + target.search);
  // JSON with "<" escaped, so no value can close the script element
  const script = JSON.stringify(target.pathname + target.search).replace(
    /</g,
    "\\u003c",
  );

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>Signing you in - Hotpoint Apps Hub</title>
<noscript><meta http-equiv="refresh" content="0;url=${href}"></noscript>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    background: #fdfbfb radial-gradient(ellipse 70% 50% at 50% 0%, rgba(254, 205, 211, 0.55), transparent);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 0 16px; text-align: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .mark { position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; }
  .ring {
    position: absolute; inset: 0; box-sizing: border-box; border-radius: 9999px;
    border: 2px solid #ffe4e6; border-top-color: #e11d48;
    animation: spin 1s linear infinite;
  }
  .tile {
    width: 64px; height: 64px; box-sizing: border-box; border-radius: 0.7rem;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid #ffe4e6; background: linear-gradient(to bottom right, #fff, #fff1f2);
    box-shadow: inset 0 1.5px 0 #fff, 0 10px 24px -10px rgba(225, 29, 72, 0.45);
  }
  .tile svg { width: 28px; height: 28px; }
  h1 { margin: 24px 0 0; font-size: 17px; font-weight: 600; letter-spacing: -0.025em; color: #0f172a; }
  p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="mark" aria-hidden="true">
  <span class="ring"></span>
  <span class="tile"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#cd240a" d="${HOTPOINT_MARK_PATH}"/></svg></span>
</div>
<div role="status">
  <h1>Signing you in</h1>
  <p>Getting the Apps Hub ready&hellip;</p>
</div>
<script>
  // After the first paint, so this screen is what stays up while the
  // exchange and the next page load. The timer covers a background tab,
  // where animation frames don't run.
  var started = false;
  function go() {
    if (started) return;
    started = true;
    location.replace(${script});
  }
  requestAnimationFrame(function () { setTimeout(go, 0); });
  setTimeout(go, 150);
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
