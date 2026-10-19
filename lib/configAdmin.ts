import { Settings } from "lucide-react";

// Client-safe: the Settings page, its role and who may see it. The server
// re-checks the role on every read and write (lib/configAdminAccess.ts).

export const CONFIG_ADMIN_ROLE = "config-admin";

export const SETTINGS_PAGE = {
  href: "/dashboard/settings",
  label: "Settings",
  Icon: Settings,
};

export const canManageSettings = (roles: string[]) =>
  roles.includes(CONFIG_ADMIN_ROLE);
