"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, CalendarX2, EyeOff } from "lucide-react";
import {
  getAdvanceConfigAdminData,
  setAdvanceExtension,
} from "@/serverActions/AdvanceConfigAdmin";
import { DatePicker } from "@/components/DatePicker";
import { AdvanceSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  Field,
  LoadError,
  primaryButtonClass,
  StatusBadge,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["AdvanceConfigAdmin"];

export default function AdvanceSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, []);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [until, setUntil] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getAdvanceConfigAdminData,
  });

  if (isLoading) return <AdvanceSettingsSkeleton />;
  if (isError || !data) {
    return (
      <LoadError what="salary advance settings" onRetry={() => refetch()} />
    );
  }

  const extensionActive =
    !!data.extendedUntil && data.extendedUntil >= data.today;

  return (
    <div className="space-y-4">
      <Card
        title="Submission window"
        description={`New salary advance requests are accepted from the 1st to the ${data.deadlineDay}th of each month (Nairobi time). An extension keeps them open later, through the date you choose.`}
      >
        <div className="rounded-control flex flex-wrap items-center gap-3 bg-neutral-50 p-3">
          {data.isOpen ? (
            <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <CalendarX2 className="h-5 w-5 text-neutral-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900">
              Submissions are {data.isOpen ? "open" : "closed"} today
              {data.isOpen &&
                (data.inRegularWindow
                  ? ` (regular window, until the ${data.deadlineDay}th)`
                  : " because of the extension")}
            </p>
            <p className="text-xs text-neutral-500">
              {extensionActive
                ? `Extended through ${data.extendedUntil}.`
                : data.extendedUntil
                  ? `The last extension ended on ${data.extendedUntil}.`
                  : "No extension has been set."}
            </p>
          </div>
          {extensionActive ? (
            <StatusBadge tone="amber">Extended</StatusBadge>
          ) : (
            <StatusBadge tone="grey">No extension</StatusBadge>
          )}
        </div>

        <p className="rounded-control flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Staff never see that an extension exists - the form simply stays open.
          Keep it to yourselves so it doesn&apos;t encourage late requests.
          Anything submitted during an extension goes out in next month&apos;s
          export.
        </p>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => setAdvanceExtension(until))) setUntil("");
          }}
        >
          <div className="w-full sm:w-64">
            <Field label="Keep submissions open through">
              <DatePicker
                value={until}
                onChange={setUntil}
                minDate={data.today}
                maxDate={data.maxDate}
                placeholder="Pick a date"
                tone="slate"
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={busy || !until}
            className={primaryButtonClass}
          >
            {extensionActive ? "Change extension" : "Extend"}
          </button>
          {extensionActive && (
            <button
              type="button"
              disabled={busy}
              className="rounded-control h-10 border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:border-neutral-400 disabled:opacity-50"
              onClick={() =>
                setConfirmation({
                  title: "End the extension now?",
                  message: data.inRegularWindow
                    ? "Submissions stay open until the regular window closes."
                    : "Submissions close immediately until the 1st of next month.",
                  confirmLabel: "End extension",
                  action: () => setAdvanceExtension(null),
                })
              }
            >
              End extension
            </button>
          )}
        </form>
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
