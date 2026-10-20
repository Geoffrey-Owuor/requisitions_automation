"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  addJobGrade,
  getEmployeeConfigAdminData,
  moveJobGrade,
  setJobGradeActive,
} from "@/serverActions/EmployeeConfigAdmin";
import { EmployeeSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  AddRow,
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  LoadError,
  smallButtonClass,
  StatusBadge,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["EmployeeConfigAdmin"];
// The employee form's cache of the grades
const RELATED_KEYS = [["JobGradesData"]];

const iconButtonClass =
  "rounded-compact p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30";

export default function EmployeeSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getEmployeeConfigAdminData,
  });

  if (isLoading) return <EmployeeSettingsSkeleton />;
  if (isError || !data) {
    return <LoadError what="employee settings" onRetry={() => refetch()} />;
  }

  // Most senior first, so "up" means a higher grade
  const grades = [...data.grades].reverse();

  return (
    <div className="space-y-4">
      <Card
        title="Job grades"
        description="Offered on each employee requisition position, most senior first. A position keeps the grade number it was submitted with, so re-ranking never renumbers an existing requisition. Deactivated grades aren't offered, but positions that already have one keep it."
      >
        <ul className="divide-y divide-neutral-100">
          {grades.map((grade, index) => (
            <li
              key={grade.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-semibold text-neutral-500">
                  Grade {grade.rank}
                </span>
                <p
                  className={`truncate text-sm ${grade.isActive ? "text-neutral-900" : "text-neutral-400 line-through"}`}
                >
                  {grade.name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!grade.isActive && (
                  <StatusBadge tone="grey">Inactive</StatusBadge>
                )}
                <button
                  type="button"
                  disabled={busy || index === 0}
                  aria-label={`Move ${grade.name} up a grade`}
                  className={iconButtonClass}
                  onClick={() => run(() => moveJobGrade(grade.id, "up"))}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={busy || index === grades.length - 1}
                  aria-label={`Move ${grade.name} down a grade`}
                  className={iconButtonClass}
                  onClick={() => run(() => moveJobGrade(grade.id, "down"))}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={smallButtonClass}
                  onClick={() =>
                    grade.isActive
                      ? setConfirmation({
                          title: `Deactivate "${grade.name}"?`,
                          message:
                            "It won't be offered on new positions. Positions that already have it keep it, including when amended, and you can reactivate it later.",
                          confirmLabel: "Deactivate",
                          action: () => setJobGradeActive(grade.id, false),
                        })
                      : run(() => setJobGradeActive(grade.id, true))
                  }
                >
                  {grade.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <AddRow
          placeholder="New job grade (added as the most senior)"
          value={name}
          onChange={setName}
          busy={busy}
          onAdd={async () => {
            if (await run(() => addJobGrade(name))) setName("");
          }}
        />
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
