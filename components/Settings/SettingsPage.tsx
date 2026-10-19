"use client";

import { useState } from "react";
import { HardHat, Monitor } from "lucide-react";
import { SETTINGS_PAGE } from "@/lib/configAdmin";
import CasualSettings from "./CasualSettings";
import ItSettings from "./ItSettings";

// One tab per area whose configuration is managed here. Travel tiers and
// job grades live in the database too but are set there by hand.
const TABS = [
  { key: "casual", label: "Casual", Icon: HardHat, Panel: CasualSettings },
  { key: "it", label: "IT", Icon: Monitor, Panel: ItSettings },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const [activeKey, setActiveKey] = useState<TabKey>("casual");
  const activeTab = TABS.find((tab) => tab.key === activeKey) ?? TABS[0];

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
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === activeTab.key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(key)}
              className={`rounded-compact inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        <activeTab.Panel />
      </div>
    </div>
  );
}
