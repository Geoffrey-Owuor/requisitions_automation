"use client";

import { HardHat } from "lucide-react";
import { SETTINGS_PAGE } from "@/lib/configAdmin";
import CasualSettings from "./CasualSettings";

// One tab per area whose configuration lives in the database. Only Casual
// so far; the tab strip is where further areas (e.g. IT) go.
const TABS = [{ key: "casual", label: "Casual", Icon: HardHat }] as const;

export default function SettingsPage() {
  const activeTab = TABS[0];

  return (
    <div className="space-y-5 px-2 pt-4 pb-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#1e1b1b]">
          <SETTINGS_PAGE.Icon className="h-5 w-5 text-neutral-500" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage the options and rates the requisition forms use. Every change
          is recorded with your name.
        </p>
      </div>

      <div role="tablist" className="flex flex-wrap gap-1.5">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === activeTab.key}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        <CasualSettings />
      </div>
    </div>
  );
}
