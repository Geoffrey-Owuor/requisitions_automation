"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Plus, Trash2, X } from "lucide-react";
import {
  addApprover,
  addHodAlternate,
  type AdminApprover,
  type ApproverAdminData,
  getApproverAdminData,
  regenerateApproverLink,
  removeApprover,
  removeHodAlternate,
  setHodAlternateOnly,
  setHodDepartment,
  setHrForms,
} from "@/serverActions/ApproverAdmin";
import {
  APPROVER_STAGES,
  type ApproverStageKey,
  HR_FORM_LABELS,
} from "@/lib/approverStages";
import { ALLOWED_HR_FORMS, type HrForm } from "@/public/assets";
import { Select } from "@/components/Select";
import { ApproversSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  Field,
  inputClass,
  ListPagination,
  LoadError,
  primaryButtonClass,
  SearchBox,
  smallButtonClass,
  StatusBadge,
  useListPage,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["ApproverAdmin"];
// The forms' cached HOD list, refreshed after a HOD change
const RELATED_KEYS = [["BaseHodArrayData"]];

type Runner = ReturnType<typeof useSettingsRunner>;
type RowProps = {
  approver: AdminApprover;
  busy: boolean;
  run: Runner["run"];
  confirm: (confirmation: Confirmation) => void;
};

export default function ApproversSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [stage, setStage] = useState<ApproverStageKey>("hod");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getApproverAdminData,
  });

  if (isLoading) return <ApproversSettingsSkeleton />;
  if (isError || !data) {
    return <LoadError what="approvers" onRetry={() => refetch()} />;
  }

  const active = APPROVER_STAGES.find((entry) => entry.key === stage)!;
  const approvers = data.approvers[stage];

  return (
    <div className="space-y-4">
      <Card
        title="Approvers"
        description="Who receives each stage's approval emails and sees its dashboard queue. Emails can't be changed - remove the approver and add them again. Anyone with pending work they alone can action can't be removed."
      >
        <div
          role="tablist"
          aria-label="Approver lists"
          className="flex flex-wrap gap-1.5"
        >
          {APPROVER_STAGES.map(({ key, label }) => {
            const isActive = key === stage;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStage(key)}
                className={`rounded-compact inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${isActive ? "bg-white/20" : "bg-neutral-100 text-neutral-500"}`}
                >
                  {data.approvers[key].length}
                </span>
              </button>
            );
          })}
        </div>

        <div role="tabpanel" className="space-y-4">
          <p className="text-xs text-neutral-500">{active.description}</p>

          {approvers.length === 0 ? (
            <p className="rounded-control bg-neutral-50 py-6 text-center text-sm text-neutral-500">
              No {active.label} approvers yet.
            </p>
          ) : (
            <ApproverList
              // Each stage starts from its first page with no search
              key={`list-${stage}`}
              stage={stage}
              approvers={approvers}
              data={data}
              busy={busy}
              run={run}
              confirm={setConfirmation}
            />
          )}

          <AddApproverForm
            key={stage}
            stage={stage}
            label={active.label}
            departments={data.departments}
            busy={busy}
            run={run}
          />
        </div>
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

function ApproverList({
  stage,
  approvers,
  data,
  busy,
  run,
  confirm,
}: Omit<RowProps, "approver"> & {
  stage: ApproverStageKey;
  approvers: AdminApprover[];
  data: ApproverAdminData;
}) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = term
    ? approvers.filter(
        (approver) =>
          approver.name.toLowerCase().includes(term) ||
          approver.email.includes(term) ||
          !!approver.department?.toLowerCase().includes(term),
      )
    : approvers;
  const { pageItems, pagination, resetPage } = useListPage(filtered);

  return (
    <div>
      <div className="flex">
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            resetPage();
          }}
          placeholder={
            stage === "hod"
              ? "Search by name, email or department"
              : "Search by name or email"
          }
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          No approvers match.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {pageItems.map((approver) => (
            <ApproverRow
              key={approver.id}
              stage={stage}
              approver={approver}
              data={data}
              busy={busy}
              run={run}
              confirm={confirm}
            />
          ))}
        </ul>
      )}
      <ListPagination pagination={pagination} />
    </div>
  );
}

function ApproverRow({
  stage,
  data,
  ...props
}: RowProps & { stage: ApproverStageKey; data: ApproverAdminData }) {
  const { approver, busy, confirm } = props;
  const stageLabel = APPROVER_STAGES.find(
    (entry) => entry.key === stage,
  )!.label;

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-neutral-900">
            <span className="truncate">{approver.name}</span>
            {approver.isAlternateOnly && (
              <StatusBadge tone="grey">Alternate only</StatusBadge>
            )}
            {!!approver.pendingAsHod && (
              <StatusBadge tone="amber">
                {approver.pendingAsHod} pending
              </StatusBadge>
            )}
          </p>
          <p className="truncate text-xs text-neutral-500">{approver.email}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            disabled={busy}
            className={`${smallButtonClass} inline-flex items-center gap-1`}
            onClick={() =>
              confirm({
                title: `Regenerate ${approver.name}'s link?`,
                message: `Every ${stageLabel} approval link already emailed to ${approver.email} stops working. Requisitions still pending for them can be opened from their dashboard, and new emails carry the new link.`,
                confirmLabel: "Regenerate link",
                action: () => regenerateApproverLink(stage, approver.id),
              })
            }
          >
            <KeyRound className="h-3 w-3" /> New link
          </button>
          <button
            type="button"
            // The server refuses it too (lib/approverPendingWork.ts)
            disabled={busy || !!approver.pendingAsHod}
            title={
              approver.pendingAsHod
                ? "Their pending HOD requisitions need to be actioned first"
                : undefined
            }
            aria-label={`Remove ${approver.name}`}
            className={`${smallButtonClass} inline-flex items-center gap-1 hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed`}
            onClick={() =>
              confirm({
                title: `Remove ${approver.name}?`,
                message:
                  stage === "hod"
                    ? `${approver.email} will no longer be offered as a HOD, and their alternate links are removed. Their past decisions stay on the requisitions.`
                    : `${approver.email} will stop receiving ${stageLabel} approval emails and lose the ${stageLabel} dashboard queue. Their past decisions stay on the requisitions.`,
                confirmLabel: "Remove approver",
                action: () => removeApprover(stage, approver.id),
              })
            }
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      </div>

      {stage === "hod" && <HodControls {...props} data={data} />}
      {stage === "hr" && <HrFormControls {...props} />}
    </li>
  );
}

function HodControls({
  approver,
  data,
  busy,
  run,
  confirm,
}: RowProps & { data: ApproverAdminData }) {
  const hods = data.approvers.hod;
  const byId = new Map(hods.map((hod) => [hod.id, hod]));
  const alternateIds = approver.alternateIds ?? [];
  const candidates = hods.filter(
    (hod) => hod.id !== approver.id && !alternateIds.includes(hod.id),
  );
  const departmentKnown =
    !approver.department || data.departments.includes(approver.department);

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_auto_minmax(0,1fr)] sm:items-center">
      <Select
        aria-label={`${approver.name}'s department`}
        value={approver.department ?? ""}
        disabled={busy}
        unlistedLabel={`${approver.department} (not a listed department)`}
        onChange={(value) =>
          run(() => setHodDepartment(approver.id, value || null))
        }
        options={[
          { value: "", label: "No department" },
          ...data.departments.map((name) => ({ value: name, label: name })),
        ]}
      />
      <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
        <input
          type="checkbox"
          className="h-4 w-4 accent-slate-900"
          checked={!!approver.isAlternateOnly}
          disabled={busy}
          onChange={(e) =>
            run(() => setHodAlternateOnly(approver.id, e.target.checked))
          }
        />
        Alternate only
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-neutral-500">Alternates:</span>
        {alternateIds.length === 0 && (
          <span className="text-xs text-neutral-400">none</span>
        )}
        {alternateIds.map((id) => {
          const alternate = byId.get(id);
          if (!alternate) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-2.5 text-[11px] font-semibold text-slate-700"
            >
              {alternate.name}
              <button
                type="button"
                disabled={busy}
                aria-label={`Remove ${alternate.name} as an alternate`}
                className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40"
                onClick={() =>
                  confirm({
                    title: `Remove ${alternate.name} as an alternate?`,
                    message: `${alternate.name} will no longer be able to act on, or be emailed about, requisitions assigned to ${approver.name}.`,
                    confirmLabel: "Remove alternate",
                    action: () => removeHodAlternate(approver.id, id),
                  })
                }
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        {candidates.length > 0 && (
          <div className="w-48">
            <Select
              aria-label={`Add an alternate for ${approver.name}`}
              value=""
              placeholder="Add alternate"
              disabled={busy}
              onChange={(value) =>
                run(() => addHodAlternate(approver.id, Number(value)))
              }
              options={candidates.map((hod) => ({
                value: String(hod.id),
                label: hod.name,
              }))}
            />
          </div>
        )}
      </div>
      {!departmentKnown && (
        <p className="text-xs text-amber-700 sm:col-span-3">
          &ldquo;{approver.department}&rdquo; isn&apos;t a listed department, so
          they&apos;re never auto-selected. Choose one of the listed
          departments.
        </p>
      )}
    </div>
  );
}

function HrFormCheckboxes({
  value,
  disabled,
  onToggle,
}: {
  value: HrForm[];
  disabled: boolean;
  onToggle: (form: HrForm, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {ALLOWED_HR_FORMS.map((form) => (
        <label
          key={form}
          className="inline-flex items-center gap-2 text-xs text-neutral-700"
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-slate-900"
            checked={value.includes(form)}
            disabled={disabled}
            onChange={(e) => onToggle(form, e.target.checked)}
          />
          {HR_FORM_LABELS[form]}
        </label>
      ))}
    </div>
  );
}

function HrFormControls({ approver, busy, run }: RowProps) {
  const forms = approver.hrForms ?? [];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-neutral-500">Acts on:</span>
      <HrFormCheckboxes
        value={forms}
        disabled={busy}
        onToggle={(form, checked) =>
          run(() =>
            setHrForms(
              approver.id,
              checked ? [...forms, form] : forms.filter((f) => f !== form),
            ),
          )
        }
      />
    </div>
  );
}

function AddApproverForm({
  stage,
  label,
  departments,
  busy,
  run,
}: {
  stage: ApproverStageKey;
  label: string;
  departments: string[];
  busy: boolean;
  run: Runner["run"];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [isAlternateOnly, setIsAlternateOnly] = useState(false);
  const [hrForms, setHrFormsDraft] = useState<HrForm[]>([...ALLOWED_HR_FORMS]);

  const ready =
    name.trim() && email.trim() && (stage !== "hr" || hrForms.length > 0);

  return (
    <form
      className="rounded-control space-y-3 bg-neutral-50 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const added = await run(() =>
          addApprover(stage, {
            name,
            email,
            department: department || null,
            isAlternateOnly,
            hrForms,
          }),
        );
        if (added) {
          setName("");
          setEmail("");
          setDepartment("");
          setIsAlternateOnly(false);
        }
      }}
    >
      <p className="text-xs font-semibold text-neutral-700">
        Add a {label} approver
      </p>
      <div
        className={`grid gap-2 ${stage === "hod" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        <Field label="Name" htmlFor={`add-${stage}-name`}>
          <input
            id={`add-${stage}-name`}
            className={inputClass}
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor={`add-${stage}-email`}>
          <input
            id={`add-${stage}-email`}
            type="email"
            className={inputClass}
            value={email}
            maxLength={255}
            placeholder="name@hotpoint.co.ke"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {stage === "hod" && (
          <Field label="Department" htmlFor={`add-${stage}-department`}>
            <Select
              id={`add-${stage}-department`}
              value={department}
              onChange={setDepartment}
              options={[
                { value: "", label: "No department" },
                ...departments.map((name) => ({ value: name, label: name })),
              ]}
            />
          </Field>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {stage === "hod" ? (
          <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-900"
              checked={isAlternateOnly}
              onChange={(e) => setIsAlternateOnly(e.target.checked)}
            />
            Alternate only (not offered on the forms)
          </label>
        ) : stage === "hr" ? (
          <HrFormCheckboxes
            value={hrForms}
            disabled={false}
            onToggle={(form, checked) =>
              setHrFormsDraft((current) =>
                checked
                  ? [...current, form]
                  : current.filter((entry) => entry !== form),
              )
            }
          />
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={busy || !ready}
          className={primaryButtonClass}
        >
          <Plus className="h-4 w-4" /> Add approver
        </button>
      </div>
    </form>
  );
}
