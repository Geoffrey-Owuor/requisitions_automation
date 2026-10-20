"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDepartment,
  getDepartmentAdminData,
  setDepartmentActive,
  setDepartmentFlag,
} from "@/serverActions/DepartmentConfigAdmin";
import { DEPARTMENT_FLAGS } from "@/lib/departmentFlags";
import { DepartmentsSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  AddRow,
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  ListPagination,
  LoadError,
  SearchBox,
  smallButtonClass,
  StatusBadge,
  useListPage,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["DepartmentAdmin"];
// The forms' cached department list, refreshed after a change
const RELATED_KEYS = [["BaseDepartmentsData"]];

export default function DepartmentsSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getDepartmentAdminData,
  });

  const term = search.trim().toLowerCase();
  const filtered = (data?.departments ?? []).filter(
    (department) =>
      !term ||
      department.name.toLowerCase().includes(term) ||
      department.hodNames.some((hod) => hod.toLowerCase().includes(term)),
  );
  const { pageItems, pagination, resetPage } = useListPage(filtered);

  if (isLoading) return <DepartmentsSettingsSkeleton />;
  if (isError || !data) {
    return <LoadError what="departments" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <Card
        title="Departments"
        description="The department list on every form. A setting applies to requisitions submitted or amended after it changes; departments can't be renamed or deleted since requisitions store the name."
      >
        <div className="flex">
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              resetPage();
            }}
            placeholder="Search by department or HOD"
          />
        </div>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500">
            No departments match.
          </p>
        )}
        <ul className="divide-y divide-neutral-100">
          {pageItems.map((department) => (
            <li
              key={department.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
            >
              <div className="min-w-0 basis-56">
                <p
                  className={`flex items-center gap-2 text-sm font-medium ${department.isActive ? "text-neutral-900" : "text-neutral-400 line-through"}`}
                >
                  <span className="truncate">{department.name}</span>
                  {!department.isActive && (
                    <StatusBadge tone="grey">Inactive</StatusBadge>
                  )}
                </p>
                {department.hodNames.length > 0 ? (
                  <p className="truncate text-xs text-neutral-500">
                    HOD: {department.hodNames.join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">
                    No HOD - submitters pick one by hand
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {DEPARTMENT_FLAGS.map((flag) => {
                  const on = department.flags[flag.key];
                  return (
                    <button
                      key={flag.key}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      title={flag.description}
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          setDepartmentFlag(department.id, flag.key, !on),
                        )
                      }
                      className={`rounded-compact inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                        on
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-neutral-300"}`}
                      />
                      {flag.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={busy}
                  className={smallButtonClass}
                  onClick={() =>
                    department.isActive
                      ? setConfirmation({
                          title: `Deactivate "${department.name}"?`,
                          message:
                            "It won't be offered on new requisitions and submissions naming it are refused. Requisitions that already use it keep it, including when they're amended, and you can reactivate it later.",
                          confirmLabel: "Deactivate",
                          action: () =>
                            setDepartmentActive(department.id, false),
                        })
                      : run(() => setDepartmentActive(department.id, true))
                  }
                >
                  {department.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <ListPagination pagination={pagination} />
        <AddRow
          placeholder="New department"
          value={name}
          onChange={setName}
          busy={busy}
          onAdd={async () => {
            if (await run(() => addDepartment(name))) setName("");
          }}
        />
        <p className="text-xs text-neutral-500">
          A new department has no HOD until one is given it on the Approvers
          tab, and uses a default &ldquo;department-location&rdquo; casual
          section until sections are added on the Casual tab.
        </p>
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
