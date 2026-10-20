"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import {
  addTravelTiers,
  deleteTravelTiers,
  getTravelConfigAdminData,
  type TravelTierRow,
} from "@/serverActions/TravelConfigAdmin";
import { DatePicker } from "@/components/DatePicker";
import { TravelSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  Field,
  inputClass,
  LoadError,
  nextDay,
  primaryButtonClass,
  smallButtonClass,
  StatusBadge,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["TravelConfigAdmin"];
// The travel form's and the guideline's caches of the thresholds
const RELATED_KEYS = [["TravelTiersData"], ["PublicTravelTiers"]];

const kes = (amount: number) => `KES ${amount.toLocaleString()}`;

const STATUS_BADGE: Record<
  TravelTierRow["status"],
  { tone: "green" | "amber" | "grey"; label: string }
> = {
  current: { tone: "green", label: "In effect" },
  scheduled: { tone: "amber", label: "Scheduled" },
  past: { tone: "grey", label: "Replaced" },
};

// Whole shillings from an input, or NaN
const parseAmount = (value: string) =>
  value.trim() === "" ? NaN : Number(value.replace(/,/g, ""));

export default function TravelSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getTravelConfigAdminData,
  });

  if (isLoading) return <TravelSettingsSkeleton />;
  if (isError || !data) {
    return <LoadError what="travel settings" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <Card
        title="Approval tiers"
        description="A trip's total cost decides its tier: Tier 1 and Tier 2 finish at HR, Tier 3 adds the Director. The thresholds in effect on the submission or amendment date apply, and each requisition keeps the tier it was given."
      >
        <ul className="divide-y divide-neutral-100">
          {data.tiers.map((tier) => {
            const badge = STATUS_BADGE[tier.status];
            return (
              <li
                key={tier.id}
                className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 ${tier.status === "past" ? "opacity-60" : ""}`}
              >
                <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-sm">
                  <TierCell
                    label="Tier 1"
                    value={`Up to ${kes(tier.tier2Above)}`}
                  />
                  <TierCell
                    label="Tier 2"
                    value={`Above ${kes(tier.tier2Above)}, below ${kes(tier.tier3From)}`}
                  />
                  <TierCell
                    label="Tier 3"
                    value={`From ${kes(tier.tier3From)}`}
                  />
                </div>
                {/* Fixed width so the tier columns line up across rows */}
                <div className="flex items-center gap-2 sm:w-72 sm:justify-end">
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    From {tier.effectiveFrom}
                  </span>
                  <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                  {tier.status === "scheduled" && (
                    <button
                      type="button"
                      disabled={busy}
                      className={smallButtonClass}
                      onClick={() =>
                        setConfirmation({
                          title: "Delete these scheduled thresholds?",
                          message: `The thresholds due to start on ${tier.effectiveFrom} won't take effect; the ones in effect before them carry on.`,
                          confirmLabel: "Delete",
                          action: () => deleteTravelTiers(tier.id),
                        })
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <ScheduleTiersForm today={data.today} busy={busy} run={run} />
      </Card>
      <ChangesCard changes={data.changes} />

      <ConfirmDialog
        confirmation={confirmation}
        busy={busy}
        onClose={() => setConfirmation(null)}
        onConfirm={async (action) => {
          if (await run(action)) setConfirmation(null);
        }}
      />
    </div>
  );
}

function TierCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-neutral-500">{label}</p>
      <p className="truncate text-neutral-900">{value}</p>
    </div>
  );
}

function ScheduleTiersForm({
  today,
  busy,
  run,
}: {
  today: string;
  busy: boolean;
  run: ReturnType<typeof useSettingsRunner>["run"];
}) {
  const tomorrow = nextDay(today);
  const [tier2Above, setTier2Above] = useState("");
  const [tier3From, setTier3From] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(tomorrow);

  const low = parseAmount(tier2Above);
  const high = parseAmount(tier3From);
  const valid =
    Number.isInteger(low) &&
    Number.isInteger(high) &&
    low >= 0 &&
    high > low &&
    effectiveFrom >= tomorrow;

  return (
    <form
      className="rounded-control space-y-3 bg-neutral-50 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const added = await run(() =>
          addTravelTiers({ tier2Above: low, tier3From: high, effectiveFrom }),
        );
        if (added) {
          setTier2Above("");
          setTier3From("");
        }
      }}
    >
      <p className="text-xs font-semibold text-neutral-700">
        Schedule new thresholds
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Tier 1 up to (KES)" htmlFor="tier2-above">
          <input
            id="tier2-above"
            inputMode="numeric"
            className={inputClass}
            value={tier2Above}
            onChange={(e) => setTier2Above(e.target.value)}
          />
        </Field>
        <Field label="Tier 3 from (KES)" htmlFor="tier3-from">
          <input
            id="tier3-from"
            inputMode="numeric"
            className={inputClass}
            value={tier3From}
            onChange={(e) => setTier3From(e.target.value)}
          />
        </Field>
        <Field label="Takes effect">
          <DatePicker
            value={effectiveFrom}
            onChange={setEffectiveFrom}
            minDate={tomorrow}
            placeholder="Pick a date"
            tone="slate"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {Number.isInteger(low) && Number.isInteger(high) && high <= low
            ? "Tier 3 must start above the Tier 1 limit."
            : "From tomorrow at the earliest, so no submission today is re-tiered."}
        </p>
        <button
          type="submit"
          disabled={busy || !valid}
          className={primaryButtonClass}
        >
          Schedule thresholds
        </button>
      </div>
    </form>
  );
}
