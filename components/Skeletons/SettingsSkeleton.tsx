import { ReactNode } from "react";

// Stand-ins for the Settings tabs while their data loads, shaped like the
// cards in components/Settings: a card header, ToggleList rows, an AddRow,
// the shaded "add" boxes and the Recent changes list.

const bar = "rounded-md bg-neutral-200";
const softBar = "rounded-md bg-neutral-100";

function CardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-surface space-y-4 border border-neutral-200 bg-white p-4">
      <div className="space-y-2">
        <div className={`h-3 w-28 ${bar}`} />
        <div className={`h-3 w-full max-w-md ${softBar}`} />
      </div>
      {children}
    </div>
  );
}

// ToggleList rows: a name, sometimes a detail line, and a pill button
function ToggleRowsSkeleton({
  rows,
  withDetail = false,
}: {
  rows: number;
  withDetail?: boolean;
}) {
  const widths = ["w-32", "w-24", "w-40", "w-28", "w-36"];
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2">
          <div className="space-y-1.5">
            <div className={`h-3.5 ${widths[i % widths.length]} ${bar}`} />
            {withDetail && <div className={`h-3 w-24 ${softBar}`} />}
          </div>
          <div className="rounded-compact h-6 w-20 shrink-0 bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function AddRowSkeleton() {
  return (
    <div className="flex gap-2">
      <div className="rounded-control h-10 flex-1 border border-neutral-200" />
      <div className="rounded-control h-10 w-20 shrink-0 bg-neutral-200" />
    </div>
  );
}

// A Field: caption over a 40px control
function FieldSkeleton() {
  return (
    <div className="space-y-1">
      <div className={`h-3 w-20 ${bar}`} />
      <div className="rounded-control h-10 border border-neutral-200 bg-white" />
    </div>
  );
}

function ChangesSkeleton() {
  return (
    <CardSkeleton>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-start gap-2 py-2">
            <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-neutral-200" />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3.5 w-3/4 ${bar}`} />
              <div className={`h-3 w-40 ${softBar}`} />
            </div>
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}

function RatesSkeleton() {
  return (
    <CardSkeleton>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
          >
            <div className="space-y-1.5">
              <div className={`h-3.5 w-48 ${bar}`} />
              <div className={`h-3 w-24 ${softBar}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3.5 w-20 ${bar}`} />
              <div className="h-5 w-16 rounded-full bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-control space-y-3 bg-neutral-50 p-3">
        <div className={`h-3 w-28 ${bar}`} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={`h-3 w-44 ${bar}`} />
          <div className="rounded-control h-10 w-36 bg-neutral-200" />
        </div>
      </div>
    </CardSkeleton>
  );
}

function LocationLimitsSkeleton() {
  return (
    <CardSkeleton>
      <div className="space-y-2">
        <div className={`h-3.5 w-3/4 ${bar}`} />
        <div className={`h-3.5 w-1/2 ${bar}`} />
      </div>
      <div className="rounded-control h-10 border border-neutral-200" />
    </CardSkeleton>
  );
}

function SectionsSkeleton() {
  return (
    <CardSkeleton>
      <div className="space-y-1">
        <div className={`h-3 w-24 ${bar}`} />
        <ToggleRowsSkeleton rows={3} withDetail />
      </div>
      <div className="rounded-control space-y-2 bg-neutral-50 p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
        <div className="flex justify-end">
          <div className="rounded-control h-10 w-32 bg-neutral-200" />
        </div>
      </div>
    </CardSkeleton>
  );
}

function SettingsSkeletonFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-pulse" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="space-y-4" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export function CasualSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the casual settings">
      <RatesSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton>
          <ToggleRowsSkeleton rows={4} />
          <AddRowSkeleton />
        </CardSkeleton>
        <LocationLimitsSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionsSkeleton />
        <CardSkeleton>
          <ToggleRowsSkeleton rows={3} />
          <AddRowSkeleton />
        </CardSkeleton>
      </div>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

export function ItSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the IT settings">
      <CardSkeleton>
        <ToggleRowsSkeleton rows={5} />
        <AddRowSkeleton />
      </CardSkeleton>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

// A list row with an initials avatar, two lines and trailing chips
function PersonRowsSkeleton({ rows }: { rows: number }) {
  const widths = ["w-32", "w-40", "w-28", "w-36"];
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-wrap items-center gap-3 py-2.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className={`h-3.5 ${widths[i % widths.length]} ${bar}`} />
            <div className={`h-3 w-48 ${softBar}`} />
          </div>
          <div className="flex gap-1.5">
            <div className="h-5 w-20 rounded-full bg-neutral-100" />
            <div className="rounded-control h-10 w-48 border border-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UsersSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the users and roles">
      <CardSkeleton>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-control h-10 min-w-48 flex-1 border border-neutral-200" />
          <div className="rounded-control h-10 w-44 border border-neutral-200" />
        </div>
        <PersonRowsSkeleton rows={6} />
      </CardSkeleton>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton>
          <ToggleRowsSkeleton rows={4} withDetail />
        </CardSkeleton>
        <CardSkeleton>
          <div className="grid gap-2 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="flex justify-end">
            <div className="rounded-control h-10 w-28 bg-neutral-200" />
          </div>
        </CardSkeleton>
      </div>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

export function ApproversSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the approvers">
      <CardSkeleton>
        <div className="flex flex-wrap gap-1.5">
          {["w-14", "w-12", "w-28", "w-28", "w-10", "w-16", "w-16"].map(
            (width, i) => (
              <div
                key={i}
                className={`rounded-compact h-7 ${width} bg-neutral-100`}
              />
            ),
          )}
        </div>
        <PersonRowsSkeleton rows={5} />
        <div className="rounded-control space-y-3 bg-neutral-50 p-3">
          <div className={`h-3 w-28 ${bar}`} />
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
          <div className="flex justify-end">
            <div className="rounded-control h-10 w-36 bg-neutral-200" />
          </div>
        </div>
      </CardSkeleton>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

export function DepartmentsSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the departments">
      <CardSkeleton>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
            >
              <div className="space-y-1.5">
                <div className={`h-3.5 w-36 ${bar}`} />
                <div className={`h-3 w-44 ${softBar}`} />
              </div>
              <div className="flex gap-1.5">
                {["w-24", "w-28", "w-28", "w-20"].map((width, j) => (
                  <div
                    key={j}
                    className={`rounded-compact h-6 ${width} border border-neutral-200`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <AddRowSkeleton />
      </CardSkeleton>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

export function TravelSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the travel settings">
      <CardSkeleton>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5"
            >
              <div className="grid flex-1 grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className={`h-3 w-12 ${softBar}`} />
                    <div className={`h-3.5 w-28 ${bar}`} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-24 ${softBar}`} />
                <div className="h-5 w-16 rounded-full bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-control space-y-3 bg-neutral-50 p-3">
          <div className={`h-3 w-36 ${bar}`} />
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
          <div className="flex justify-end">
            <div className="rounded-control h-10 w-40 bg-neutral-200" />
          </div>
        </div>
      </CardSkeleton>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

export function EmployeeSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the employee settings">
      <CardSkeleton>
        <ToggleRowsSkeleton rows={9} />
        <AddRowSkeleton />
      </CardSkeleton>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

export function CasualBudgetsSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the casual budgets">
      <CardSkeleton>
        <div className="w-full sm:w-56">
          <FieldSkeleton />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-2.5">
              <div className={`h-3.5 w-32 ${bar}`} />
              <div className={`h-3.5 w-24 ${softBar}`} />
              <div className={`h-3.5 w-20 ${softBar}`} />
              <div className="h-5 w-16 rounded-full bg-neutral-100" />
              <div className="rounded-compact ml-auto h-6 w-14 border border-neutral-200" />
            </div>
          ))}
        </div>
      </CardSkeleton>
      <CardSkeleton>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
        <div className="flex justify-end">
          <div className="rounded-control h-10 w-32 bg-neutral-200" />
        </div>
      </CardSkeleton>
    </SettingsSkeletonFrame>
  );
}

export function AdvanceSettingsSkeleton() {
  return (
    <SettingsSkeletonFrame label="Loading the salary advance settings">
      <CardSkeleton>
        <div className="rounded-control flex items-center gap-3 bg-neutral-50 p-3">
          <div className="h-5 w-5 rounded-full bg-neutral-200" />
          <div className="flex-1 space-y-1.5">
            <div className={`h-3.5 w-64 ${bar}`} />
            <div className={`h-3 w-40 ${softBar}`} />
          </div>
          <div className="h-5 w-20 rounded-full bg-neutral-100" />
        </div>
        <div className="rounded-control h-14 bg-neutral-50" />
        <div className="flex items-end gap-2">
          <div className="w-64">
            <FieldSkeleton />
          </div>
          <div className="rounded-control h-10 w-24 bg-neutral-200" />
        </div>
      </CardSkeleton>
      <ChangesSkeleton />
    </SettingsSkeletonFrame>
  );
}

// Audit log entries inside an already-rendered card
export function AuditLogSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <span className="sr-only">Loading the audit log</span>
      <div className="divide-y divide-neutral-100" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 py-2.5"
          >
            <div className="flex-1 space-y-1.5">
              <div className={`h-3.5 w-3/4 ${bar}`} />
              <div className={`h-3 w-64 ${softBar}`} />
            </div>
            <div className="h-5 w-16 rounded-full bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
