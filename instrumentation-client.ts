import { useLoadingStore } from "@/store/useLoadingStore";

// Starts the top progress line (components/LoadingLine.tsx) whenever the
// router begins a navigation to another path. It runs only for navigations
// the router actually starts, so link clicks the unsaved-changes guard cancels
// never show it. Query-only changes (?tab=) and back/forward are skipped.
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  if (navigationType === "traverse") return;

  // Called before history updates, so location is still the current page.
  const target = new URL(url, window.location.href);
  if (target.pathname === window.location.pathname) return;

  useLoadingStore.getState().startNavigation();
}
