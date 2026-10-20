"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import {
  type DepartmentBudget,
  getCasualBudgetAdminData,
  saveCasualDepartmentBudget,
} from "@/serverActions/CasualBudgetAdmin";
import { BUDGET_UNIT_LABELS } from "@/lib/casualBudgetRules";
import { Select } from "@/components/Select";
import { CasualBudgetsSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  Card,
  ChangesCard,
  Field,
  inputClass,
  LoadError,
  primaryButtonClass,
  smallButtonClass,
  StatusBadge,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["CasualBudgetAdmin"];
// The budget estimate on casual requisitions
const RELATED_KEYS = [["CasualBudgetEstimate"]];

const MONTH_NAMES = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const kes = (amount: number) =>
  `KES ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const toText = (value: number | null) => (value === null ? "" : String(value));
// A shillings amount from an input: null when empty, NaN when invalid
const parseAmount = (text: string) => {
  const trimmed = text.replace(/,/g, "").trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
};

function coverage(department: DepartmentBudget) {
  const values = department.units.flatMap((unit) => department.months[unit]);
  const set = values.filter((value) => value !== null).length;
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return {
    total,
    status: set === 0 ? "none" : set === values.length ? "complete" : "partial",
  } as const;
}

export default function CasualBudgetsSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [financialYear, setFinancialYear] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [...ADMIN_KEY, financialYear],
    queryFn: () => getCasualBudgetAdminData(financialYear ?? undefined),
    // Keep the previous year on screen while another one loads
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <CasualBudgetsSettingsSkeleton />;
  if (isError || !data) {
    return <LoadError what="casual budgets" onRetry={() => refetch()} />;
  }

  const department =
    data.departments.find((entry) => entry.department === selected) ??
    data.departments[0];

  return (
    <div className="space-y-4">
      <Card
        title="Casual budgets"
        description="Each department's monthly casual budget, statutory cost per casual and baseline spend for a financial year (April to March). They only feed the budget estimate shown on casual requisitions; an empty month has no budget."
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full sm:w-56">
            <Field label="Financial year">
              <Select
                aria-label="Financial year"
                value={data.financialYear}
                busy={isFetching}
                onChange={setFinancialYear}
                options={data.financialYears.map((year) => ({
                  value: year,
                  label:
                    year === data.currentFinancialYear
                      ? `${year} (current)`
                      : year,
                }))}
              />
            </Field>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                <th className="py-2 pr-3 font-semibold">Department</th>
                <th className="py-2 pr-3 font-semibold">Year total</th>
                <th className="py-2 pr-3 font-semibold">Statutory / casual</th>
                <th className="py-2 pr-3 font-semibold">Months</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.departments.map((entry) => {
                const { total, status } = coverage(entry);
                const isSelected = entry.department === department?.department;
                return (
                  <tr
                    key={entry.department}
                    className={isSelected ? "bg-slate-50" : undefined}
                  >
                    <td className="py-2 pr-3 text-neutral-900">
                      {entry.department}
                      {entry.units.length > 1 && (
                        <span className="ml-1.5 text-xs text-neutral-400">
                          ({entry.units.length} budgets)
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-neutral-700">
                      {status === "none" ? "-" : kes(total)}
                    </td>
                    <td className="py-2 pr-3 text-neutral-700">
                      {entry.statutory === null ? "-" : kes(entry.statutory)}
                    </td>
                    <td className="py-2 pr-3">
                      {status === "complete" ? (
                        <StatusBadge tone="green">All set</StatusBadge>
                      ) : status === "partial" ? (
                        <StatusBadge tone="amber">Some missing</StatusBadge>
                      ) : (
                        <StatusBadge tone="grey">Not set</StatusBadge>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className={`${smallButtonClass} inline-flex items-center gap-1`}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(entry.department)}
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {department && (
        <BudgetEditor
          // A fresh draft for each department and year
          key={`${data.financialYear}:${department.department}`}
          financialYear={data.financialYear}
          department={department}
          busy={busy}
          run={run}
        />
      )}
      <ChangesCard changes={data.changes} />
    </div>
  );
}

function BudgetEditor({
  financialYear,
  department,
  busy,
  run,
}: {
  financialYear: string;
  department: DepartmentBudget;
  busy: boolean;
  run: ReturnType<typeof useSettingsRunner>["run"];
}) {
  const [months, setMonths] = useState(() =>
    Object.fromEntries(
      department.units.map((unit) => [
        unit,
        department.months[unit].map(toText),
      ]),
    ),
  );
  const [baselines, setBaselines] = useState(() =>
    Object.fromEntries(
      department.units.map((unit) => [
        unit,
        toText(department.baselines[unit]),
      ]),
    ),
  );
  const [statutory, setStatutory] = useState(toText(department.statutory));
  const [fill, setFill] = useState<Record<string, string>>({});

  const startYear = Number(financialYear.slice(0, 4));
  const monthLabel = (index: number) =>
    `${MONTH_NAMES[index]} ${index < 9 ? startYear : startYear + 1}`;

  const parsedMonths = Object.fromEntries(
    department.units.map((unit) => [unit, months[unit].map(parseAmount)]),
  );
  const parsedBaselines = Object.fromEntries(
    department.units.map((unit) => [unit, parseAmount(baselines[unit])]),
  );
  const parsedStatutory = parseAmount(statutory);
  const invalid =
    Object.values(parsedMonths).some((values) =>
      values.some((value) => Number.isNaN(value)),
    ) ||
    Object.values(parsedBaselines).some((value) => Number.isNaN(value)) ||
    Number.isNaN(parsedStatutory);

  return (
    <Card
      title={`${department.department} · ${financialYear}`}
      description="Amounts in shillings. Clear a field to remove that figure."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() =>
            saveCasualDepartmentBudget({
              department: department.department,
              financialYear,
              months: parsedMonths,
              baselines: parsedBaselines,
              statutory: parsedStatutory,
            }),
          );
        }}
      >
        {department.units.map((unit) => {
          const fillValue = fill[unit] ?? "";
          const fillAmount = parseAmount(fillValue);
          return (
            <fieldset
              key={unit}
              className="rounded-control space-y-3 border border-neutral-200 p-3"
            >
              <legend className="px-1 text-xs font-semibold text-neutral-700">
                {BUDGET_UNIT_LABELS[unit]}
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {months[unit].map((value, index) => (
                  <Field
                    key={index}
                    label={monthLabel(index)}
                    htmlFor={`budget-${unit}-${index}`}
                  >
                    <input
                      id={`budget-${unit}-${index}`}
                      inputMode="decimal"
                      className={`${inputClass} ${Number.isNaN(parsedMonths[unit][index]) ? "border-rose-400" : ""}`}
                      value={value}
                      onChange={(e) =>
                        setMonths((current) => ({
                          ...current,
                          [unit]: current[unit].map((entry, i) =>
                            i === index ? e.target.value : entry,
                          ),
                        }))
                      }
                    />
                  </Field>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-40">
                  <Field label="Same every month" htmlFor={`fill-${unit}`}>
                    <input
                      id={`fill-${unit}`}
                      inputMode="decimal"
                      className={inputClass}
                      value={fillValue}
                      onChange={(e) =>
                        setFill((current) => ({
                          ...current,
                          [unit]: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  className={`${smallButtonClass} h-10`}
                  disabled={fillAmount === null || Number.isNaN(fillAmount)}
                  onClick={() =>
                    setMonths((current) => ({
                      ...current,
                      [unit]: current[unit].map(() => fillValue.trim()),
                    }))
                  }
                >
                  Fill all 12 months
                </button>
                <div className="ml-auto w-full sm:w-56">
                  <Field
                    label="Baseline spend (pre-launch)"
                    htmlFor={`baseline-${unit}`}
                  >
                    <input
                      id={`baseline-${unit}`}
                      inputMode="decimal"
                      className={`${inputClass} ${Number.isNaN(parsedBaselines[unit]) ? "border-rose-400" : ""}`}
                      value={baselines[unit]}
                      onChange={(e) =>
                        setBaselines((current) => ({
                          ...current,
                          [unit]: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            </fieldset>
          );
        })}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full sm:w-56">
            <Field label="Statutory cost per casual" htmlFor="statutory-cost">
              <input
                id="statutory-cost"
                inputMode="decimal"
                className={`${inputClass} ${Number.isNaN(parsedStatutory) ? "border-rose-400" : ""}`}
                value={statutory}
                onChange={(e) => setStatutory(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            {invalid && (
              <p className="text-xs text-rose-600">
                Amounts must be numbers of 0 or more.
              </p>
            )}
            <button
              type="submit"
              disabled={busy || invalid}
              className={primaryButtonClass}
            >
              Save budget
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
}
