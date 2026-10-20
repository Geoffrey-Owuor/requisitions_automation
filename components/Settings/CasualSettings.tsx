"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Plus } from "lucide-react";
import {
  AddRow,
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  Field,
  nextDay,
  inputClass,
  primaryButtonClass,
  smallButtonClass,
  StatusBadge,
  ToggleList,
  useSettingsRunner,
} from "./SettingsPrimitives";
import { DatePicker } from "@/components/DatePicker";
import { Select } from "@/components/Select";
import { CasualSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  addCasualCategory,
  addCasualLocation,
  addCasualRate,
  addCasualSection,
  CasualConfigAdminData,
  deleteCasualRate,
  getCasualConfigAdminData,
  setCasualCategoryActive,
  setCasualLocationActive,
  setCasualSectionActive,
  setDepartmentLocationLimits,
} from "@/serverActions/CasualConfigAdmin";
import {
  currentCasualRates,
  describeCasualRateScope,
} from "@/lib/casualConfig";
import {
  BUDGET_UNIT_LABELS,
  type CasualBudgetUnit,
} from "@/lib/casualBudgetRules";
import type { ConfigActionResult } from "@/lib/configAdminAccess";

const ADMIN_KEY = ["CasualConfigAdmin"];
// The form and guideline caches of the same data, refreshed after a change
const RELATED_KEYS = [["CasualConfigData"], ["PublicCasualRates"]];

export default function CasualSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getCasualConfigAdminData,
  });

  if (isLoading) {
    return <CasualSettingsSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-surface border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        The casual settings could not be loaded.{" "}
        <button
          type="button"
          onClick={() => refetch()}
          className="font-semibold underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RatesCard data={data} busy={busy} run={run} confirm={setConfirmation} />
      <div className="grid gap-4 lg:grid-cols-2">
        <LocationsCard
          data={data}
          busy={busy}
          run={run}
          confirm={setConfirmation}
        />
        <LocationLimitsCard data={data} busy={busy} run={run} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionsCard
          data={data}
          busy={busy}
          run={run}
          confirm={setConfirmation}
        />
        <CategoriesCard
          data={data}
          busy={busy}
          run={run}
          confirm={setConfirmation}
        />
      </div>
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

type CardProps = {
  data: CasualConfigAdminData;
  busy: boolean;
  run: (action: () => Promise<ConfigActionResult>) => Promise<boolean>;
  confirm: (confirmation: Confirmation) => void;
};

// ---- Rates ----

function RatesCard({ data, busy, run, confirm }: CardProps) {
  const [showSuperseded, setShowSuperseded] = useState(false);
  const [department, setDepartment] = useState("");
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ratePerDay, setRatePerDay] = useState("");
  const tomorrow = nextDay(data.today);
  const [effectiveFrom, setEffectiveFrom] = useState(tomorrow);

  const rules = data.rates;
  // General first, most specific last - the order the guideline lists them
  const current = currentCasualRates(rules, data.today);
  const currentIds = new Set(current.map((rule) => rule.id));
  const scheduled = rules.filter((rate) => rate.effectiveFrom > data.today);
  const superseded = rules.filter(
    (rate) => rate.effectiveFrom <= data.today && !currentIds.has(rate.id),
  );

  const activeLocations = data.locations.filter(
    (location) => location.isActive,
  );
  const activeCategories = data.categories.filter(
    (category) => category.isActive,
  );
  const rateValue = Number(ratePerDay);
  const canAdd =
    Number.isInteger(rateValue) && rateValue > 0 && effectiveFrom >= tomorrow;

  const scopePreview = describeCasualRateScope({
    department: department || null,
    location:
      activeLocations.find((l) => String(l.id) === locationId)?.name ?? null,
    category:
      activeCategories.find((c) => String(c.id) === categoryId)?.name ?? null,
    ratePerDay: 0,
    effectiveFrom: "",
  });

  const addRate = async () => {
    const added = await run(() =>
      addCasualRate({
        department: department || null,
        locationId: locationId ? Number(locationId) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        ratePerDay: rateValue,
        effectiveFrom,
      }),
    );
    if (added) setRatePerDay("");
  };

  const rateRow = (
    rate: (typeof rules)[number],
    status: "current" | "scheduled" | "superseded",
  ) => (
    <li
      key={rate.id}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          {describeCasualRateScope(rate)}
        </p>
        <p className="text-xs text-neutral-500">
          {/* The rates seeded by migration 025 are dated 2000-01-01 */}
          From{" "}
          {rate.effectiveFrom === "2000-01-01"
            ? "the start"
            : rate.effectiveFrom}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-900">
          KES {rate.ratePerDay.toLocaleString()}
        </span>
        {status === "current" && (
          <StatusBadge tone="green">In effect</StatusBadge>
        )}
        {status === "scheduled" && (
          <StatusBadge tone="amber">Scheduled</StatusBadge>
        )}
        {status === "superseded" && (
          <StatusBadge tone="grey">Superseded</StatusBadge>
        )}
        {status === "scheduled" && (
          <button
            type="button"
            disabled={busy}
            className={smallButtonClass}
            onClick={() =>
              confirm({
                title: "Delete this scheduled rate?",
                message: `KES ${rate.ratePerDay.toLocaleString()} for ${describeCasualRateScope(rate)} from ${rate.effectiveFrom} won't take effect.`,
                confirmLabel: "Delete rate",
                action: () => deleteCasualRate(rate.id),
              })
            }
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );

  return (
    <Card
      title="Daily rates"
      description="Where more than one rate matches a requisition, the most specific wins: department, then location, then category. A change is a new rate from a future date - rates already in effect are never edited, and each requisition keeps the rate it was priced at."
    >
      <ul className="divide-y divide-neutral-100">
        {current.map((rate) => rateRow(rate, "current"))}
        {scheduled.map((rate) => rateRow(rate, "scheduled"))}
        {showSuperseded &&
          superseded.map((rate) => rateRow(rate, "superseded"))}
      </ul>
      {superseded.length > 0 && (
        <button
          type="button"
          onClick={() => setShowSuperseded((shown) => !shown)}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
        >
          {showSuperseded ? "Hide" : "Show"} superseded rates (
          {superseded.length})
        </button>
      )}

      <div className="rounded-control space-y-3 bg-neutral-50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <CalendarClock className="h-3.5 w-3.5" /> Schedule a rate
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Department" htmlFor="rate-department">
            <Select
              id="rate-department"
              value={department}
              onChange={setDepartment}
              options={[
                { value: "", label: "Any department" },
                ...data.departments.map((name) => ({
                  value: name,
                  label: name,
                })),
              ]}
            />
          </Field>
          <Field label="Location" htmlFor="rate-location">
            <Select
              id="rate-location"
              value={locationId}
              onChange={setLocationId}
              options={[
                { value: "", label: "Any location" },
                ...activeLocations.map((location) => ({
                  value: String(location.id),
                  label: location.name,
                })),
              ]}
            />
          </Field>
          <Field label="Category" htmlFor="rate-category">
            <Select
              id="rate-category"
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: "", label: "Any category" },
                ...activeCategories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                })),
              ]}
            />
          </Field>
          <Field label="Rate per day (KES)" htmlFor="rate-amount">
            <input
              id="rate-amount"
              className={inputClass}
              inputMode="numeric"
              placeholder="e.g. 850"
              value={ratePerDay}
              onChange={(e) => setRatePerDay(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Takes effect from">
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
            Applies to:{" "}
            <span className="font-medium text-neutral-800">{scopePreview}</span>
          </p>
          <button
            type="button"
            disabled={busy || !canAdd}
            onClick={addRate}
            className={primaryButtonClass}
          >
            <Plus className="h-4 w-4" /> Schedule rate
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---- Locations ----

function LocationsCard({ data, busy, run, confirm }: CardProps) {
  const [name, setName] = useState("");

  return (
    <Card
      title="Locations"
      description="A deactivated location is no longer offered on new requisitions; existing ones keep it."
    >
      <ToggleList
        items={data.locations}
        busy={busy}
        label="location"
        confirm={confirm}
        setActive={setCasualLocationActive}
        run={run}
      />
      <AddRow
        placeholder="New location"
        value={name}
        onChange={setName}
        busy={busy}
        onAdd={async () => {
          if (await run(() => addCasualLocation(name))) setName("");
        }}
      />
    </Card>
  );
}

function LocationLimitsCard({ data, busy, run }: Omit<CardProps, "confirm">) {
  const [department, setDepartment] = useState("");
  const [selected, setSelected] = useState<number[] | null>(null);

  const saved =
    data.departmentLocations.find((row) => row.department === department)
      ?.locationIds ?? [];
  // Unsaved picks, or the department's saved limits
  const chosen = selected ?? saved;
  // Inactive locations only show while a limit still names them
  const options = data.locations.filter(
    (location) => location.isActive || chosen.includes(location.id),
  );
  const locationName = (id: number) =>
    data.locations.find((location) => location.id === id)?.name ?? String(id);

  const toggle = (id: number) =>
    setSelected(
      chosen.includes(id)
        ? chosen.filter((other) => other !== id)
        : [...chosen, id],
    );

  return (
    <Card
      title="Department location limits"
      description="Departments listed here may only use their chosen locations; every other department may use every active location."
    >
      {data.departmentLocations.length > 0 && (
        <ul className="space-y-1 text-sm">
          {data.departmentLocations.map((row) => (
            <li key={row.department} className="text-neutral-700">
              <span className="font-medium text-neutral-900">
                {row.department}:
              </span>{" "}
              {row.locationIds.map(locationName).join(", ")}
            </li>
          ))}
        </ul>
      )}
      <Select
        aria-label="Department"
        placeholder="Choose a department to edit"
        value={department}
        onChange={(next) => {
          setDepartment(next);
          setSelected(null);
        }}
        options={data.departments.map((name) => {
          const limited = data.departmentLocations.find(
            (row) => row.department === name,
          )?.locationIds.length;
          return {
            value: name,
            label: name,
            description: limited
              ? `Limited to ${limited} location${limited === 1 ? "" : "s"}`
              : undefined,
          };
        })}
      />
      {department && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {options.map((location) => {
              const isChosen = chosen.includes(location.id);
              return (
                <button
                  key={location.id}
                  type="button"
                  aria-pressed={isChosen}
                  onClick={() => toggle(location.id)}
                  className={`rounded-compact border px-3 py-1 text-xs font-medium transition-colors ${
                    isChosen
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {location.name}
                  {!location.isActive && " (inactive)"}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-neutral-500">
              {chosen.length === 0
                ? "No locations chosen: no limits, every active location."
                : `${chosen.length} location${chosen.length === 1 ? "" : "s"} chosen.`}
            </p>
            <button
              type="button"
              disabled={busy || selected === null}
              className={primaryButtonClass}
              onClick={async () => {
                if (
                  await run(() =>
                    setDepartmentLocationLimits(department, chosen),
                  )
                ) {
                  setSelected(null);
                }
              }}
            >
              Save limits
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

// ---- Sections ----

function SectionsCard({ data, busy, run, confirm }: CardProps) {
  const [department, setDepartment] = useState("");
  const [name, setName] = useState("");
  const [budgetUnit, setBudgetUnit] = useState<CasualBudgetUnit>("default");

  const departmentsWithSections = [
    ...new Set(data.sections.map((section) => section.department)),
  ];

  return (
    <Card
      title="Sections"
      description={
        <>
          A department with sections picks from them; any other gets a single
          &quot;department-location&quot; section. A section&apos;s budget unit
          decides which casual budget its spend counts against, and can&apos;t
          be changed once added.
        </>
      }
    >
      {departmentsWithSections.map((sectionDepartment) => (
        <div key={sectionDepartment} className="space-y-1">
          <p className="text-xs font-semibold text-neutral-700">
            {sectionDepartment}
          </p>
          <ToggleList
            items={data.sections
              .filter((section) => section.department === sectionDepartment)
              .map((section) => ({
                ...section,
                detail: BUDGET_UNIT_LABELS[section.budgetUnit],
              }))}
            busy={busy}
            label="section"
            confirm={confirm}
            setActive={setCasualSectionActive}
            run={run}
          />
        </div>
      ))}
      <div className="rounded-control space-y-2 bg-neutral-50 p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Department" htmlFor="section-department">
            <Select
              id="section-department"
              value={department}
              onChange={setDepartment}
              options={data.departments.map((option) => ({
                value: option,
                label: option,
              }))}
            />
          </Field>
          <Field label="Section name" htmlFor="section-name">
            <input
              id="section-name"
              className={inputClass}
              placeholder="e.g. Receiving"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Budget unit" htmlFor="section-budget-unit">
            <Select
              id="section-budget-unit"
              value={budgetUnit}
              onChange={(next) => setBudgetUnit(next as CasualBudgetUnit)}
              options={Object.entries(BUDGET_UNIT_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </Field>
        </div>
        {department && !departmentsWithSections.includes(department) && (
          <p className="text-xs text-amber-700">
            {department} has no sections yet: after this one, its requisitions
            pick from its sections instead of getting one per location.
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={busy || !department || !name.trim()}
            className={primaryButtonClass}
            onClick={async () => {
              if (
                await run(() => addCasualSection(department, name, budgetUnit))
              ) {
                setName("");
              }
            }}
          >
            <Plus className="h-4 w-4" /> Add section
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---- Categories ----

function CategoriesCard({ data, busy, run, confirm }: CardProps) {
  const [name, setName] = useState("");

  return (
    <Card
      title="Categories"
      description="Asked for by departments flagged to require a casual category (Engineering & HVAC). Rates can be set per category."
    >
      <ToggleList
        items={data.categories}
        busy={busy}
        label="category"
        confirm={confirm}
        setActive={setCasualCategoryActive}
        run={run}
      />
      <AddRow
        placeholder="New category"
        value={name}
        onChange={setName}
        busy={busy}
        onAdd={async () => {
          if (await run(() => addCasualCategory(name))) setName("");
        }}
      />
    </Card>
  );
}
