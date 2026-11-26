// How many desktop rail slots fit the window height
// (components/DashboardSidebar.tsx), remembered in a cookie so the server can
// render the rail already split into items + More. Without it the server
// would render every item and the extras would jump into More on hydration.
// It's only a layout hint: a wrong or stale value is corrected by the
// rail's own measurement.
export const RAIL_FIT_COOKIE = "dashboard_rail_fit";

const MAX_SLOTS = 100;

export function parseRailFit(value: string | undefined): number | null {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const fits = Number(value);
  return fits <= MAX_SLOTS ? fits : null;
}

export function saveRailFit(fits: number) {
  try {
    document.cookie = `${RAIL_FIT_COOKIE}=${Math.min(fits, MAX_SLOTS)}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Cookies blocked: the rail still measures on every load
  }
}

// The items shown for a number of slots: all of them if they fit, else one
// slot fewer so More can take the last
export const visibleRailItems = (fits: number, itemCount: number) =>
  fits >= itemCount ? itemCount : Math.max(fits - 1, 0);
