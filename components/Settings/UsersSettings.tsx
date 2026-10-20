"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Pencil, Plus, Search, X } from "lucide-react";
import {
  addUser,
  assignRole,
  deactivateUser,
  getUserRoleAdminData,
  reactivateUser,
  removeRole,
  setRoleDescription,
  type UserRoleAdminData,
} from "@/serverActions/UserRoleAdmin";
import { CONFIG_ADMIN_ROLE } from "@/lib/configAdmin";
import { Select } from "@/components/Select";
import { UsersSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  Field,
  inputClass,
  LoadError,
  primaryButtonClass,
  smallButtonClass,
  StatusBadge,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["UserRoleAdmin"];
const PAGE_SIZE = 25;
// Role filter values besides a role id
const ANY_ROLE = "";
const NO_ROLE = "none";
const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
];

type User = UserRoleAdminData["users"][number];
type Role = UserRoleAdminData["roles"][number];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

export default function UsersSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, []);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getUserRoleAdminData,
  });

  if (isLoading) return <UsersSettingsSkeleton />;
  if (isError || !data) {
    return <LoadError what="users and roles" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <UsersCard data={data} busy={busy} run={run} confirm={setConfirmation} />
      <div className="grid gap-4 lg:grid-cols-2">
        <RolesCard roles={data.roles} busy={busy} run={run} />
        <AddUserCard busy={busy} run={run} />
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

type RunProps = {
  busy: boolean;
  run: ReturnType<typeof useSettingsRunner>["run"];
};

function UsersCard({
  data,
  busy,
  run,
  confirm,
}: RunProps & {
  data: UserRoleAdminData;
  confirm: (confirmation: Confirmation) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(ANY_ROLE);
  const [statusFilter, setStatusFilter] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const rolesById = useMemo(
    () => new Map(data.roles.map((role) => [role.id, role])),
    [data.roles],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.users.filter((user) => {
      if (statusFilter === "active" && user.deactivation) return false;
      if (statusFilter === "deactivated" && !user.deactivation) return false;
      if (roleFilter === NO_ROLE && user.roleIds.length > 0) return false;
      if (
        roleFilter !== ANY_ROLE &&
        roleFilter !== NO_ROLE &&
        !user.roleIds.includes(Number(roleFilter))
      ) {
        return false;
      }
      return (
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.includes(term)
      );
    });
  }, [data.users, search, roleFilter, statusFilter]);

  return (
    <Card
      title={`Users (${data.users.length})`}
      description="Everyone who has signed in, plus anyone added below. Role changes and deactivations apply on the user's next page load; a deactivated user can't sign in until reactivated, and keeps their roles. Approver access isn't a role - it comes from the Approvers tab."
    >
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            aria-label="Search users"
            className={`${inputClass} pl-9`}
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShown(PAGE_SIZE);
            }}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setShown(PAGE_SIZE);
            }}
            options={[
              { value: ANY_ROLE, label: "Any role" },
              { value: NO_ROLE, label: "No roles" },
              ...data.roles.map((role) => ({
                value: String(role.id),
                label: role.name,
              })),
            ]}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setShown(PAGE_SIZE);
            }}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">
          No users match.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {filtered.slice(0, shown).map((user) => (
            <UserRow
              key={user.id}
              user={user}
              roles={data.roles}
              rolesById={rolesById}
              isViewer={user.email === data.viewerEmail}
              busy={busy}
              run={run}
              confirm={confirm}
            />
          ))}
        </ul>
      )}

      {filtered.length > shown && (
        <div className="flex justify-center">
          <button
            type="button"
            className={smallButtonClass}
            onClick={() => setShown((count) => count + PAGE_SIZE)}
          >
            Show more ({filtered.length - shown} left)
          </button>
        </div>
      )}
    </Card>
  );
}

function UserRow({
  user,
  roles,
  rolesById,
  isViewer,
  busy,
  run,
  confirm,
}: RunProps & {
  user: User;
  roles: Role[];
  rolesById: Map<number, Role>;
  isViewer: boolean;
  confirm: (confirmation: Confirmation) => void;
}) {
  const unheld = roles.filter((role) => !user.roleIds.includes(role.id));
  const { deactivation } = user;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${deactivation ? "bg-neutral-100 text-neutral-400" : "bg-slate-100 text-slate-700"}`}
      >
        {initials(user.name) || "?"}
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p
          className={`flex items-center gap-1.5 text-sm font-medium ${deactivation ? "text-neutral-400" : "text-neutral-900"}`}
        >
          <span className="truncate">{user.name}</span>
          {isViewer && (
            <span className="text-xs font-normal text-neutral-400">(you)</span>
          )}
          {deactivation && <StatusBadge tone="grey">Deactivated</StatusBadge>}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {user.email} ·{" "}
          {user.lastSignIn
            ? `Last signed in ${user.lastSignIn}`
            : "Not signed in yet"}
        </p>
        {deactivation && (
          <p className="text-xs break-words text-neutral-500">
            Deactivated {deactivation.at}
            {deactivation.byEmail && ` by ${deactivation.byEmail}`}
            {deactivation.reason && ` · ${deactivation.reason}`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {user.roleIds.map((roleId) => {
          const role = rolesById.get(roleId);
          if (!role) return null;
          const locked = isViewer && role.name === CONFIG_ADMIN_ROLE;
          return (
            <span
              key={roleId}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-2.5 text-[11px] font-semibold text-slate-700"
            >
              {role.name}
              <button
                type="button"
                disabled={busy || locked}
                aria-label={`Remove ${role.name} from ${user.name}`}
                title={
                  locked
                    ? "You can't remove your own config-admin role"
                    : undefined
                }
                className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() =>
                  confirm({
                    title: `Remove ${role.name}?`,
                    message: `${user.name} (${user.email}) will lose what the ${role.name} role gives them on their next page load.`,
                    confirmLabel: "Remove role",
                    action: () => removeRole(user.id, roleId),
                  })
                }
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        {unheld.length > 0 && (
          <div className="w-48">
            <Select
              aria-label={`Give ${user.name} a role`}
              value=""
              placeholder="Add role"
              disabled={busy}
              onChange={(value) =>
                run(() => assignRole(user.id, Number(value)))
              }
              options={unheld.map((role) => ({
                value: String(role.id),
                label: role.name,
              }))}
            />
          </div>
        )}
        {deactivation ? (
          <button
            type="button"
            disabled={busy}
            className={smallButtonClass}
            onClick={() =>
              confirm({
                title: `Reactivate ${user.name}?`,
                message: `${user.name} (${user.email}) will be able to sign in again, with the roles listed here.`,
                confirmLabel: "Reactivate",
                action: () => reactivateUser(user.id),
              })
            }
          >
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || isViewer}
            title={
              isViewer ? "You can't deactivate your own account" : undefined
            }
            className={`${smallButtonClass} disabled:cursor-not-allowed`}
            onClick={() =>
              confirm({
                title: `Deactivate ${user.name}?`,
                message: `${user.name} (${user.email}) won't be able to sign in, and is signed out on their next page load. Their requisitions carry on through approval. If they're an approver, remove them on the Approvers tab first.`,
                confirmLabel: "Deactivate",
                input: { label: "Reason (optional)", maxLength: 500 },
                action: (reason) => deactivateUser(user.id, reason),
              })
            }
          >
            Deactivate
          </button>
        )}
      </div>
    </li>
  );
}

function RolesCard({ roles, busy, run }: RunProps & { roles: Role[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <Card
      title="Roles"
      description="The roles the app checks for. They can't be added or renamed here, since the code looks them up by name."
    >
      <ul className="divide-y divide-neutral-100">
        {roles.map((role) => (
          <li key={role.id} className="py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-mono text-xs font-semibold text-neutral-900">
                {role.name}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {role.holders} {role.holders === 1 ? "user" : "users"}
                </span>
                {editingId !== role.id && (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Edit the ${role.name} description`}
                    className="rounded-compact p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                    onClick={() => {
                      setEditingId(role.id);
                      setDraft(role.description);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            {editingId === role.id ? (
              <form
                className="mt-1.5 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run(() => setRoleDescription(role.id, draft))) {
                    setEditingId(null);
                  }
                }}
              >
                <input
                  aria-label={`${role.name} description`}
                  className={inputClass}
                  value={draft}
                  maxLength={200}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  aria-label="Save description"
                  className={primaryButtonClass}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Cancel"
                  className="rounded-control inline-flex h-10 shrink-0 items-center border border-neutral-200 px-3 text-neutral-600 hover:border-neutral-400"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <p className="text-xs text-neutral-500">{role.description}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AddUserCard({ busy, run }: RunProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  return (
    <Card
      title="Add a user"
      description="Only needed to give someone a role before they first sign in - everyone else is added when they sign in. Use their Microsoft 365 email address."
    >
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => addUser(email, name))) {
            setEmail("");
            setName("");
          }
        }}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Email" htmlFor="add-user-email">
            <input
              id="add-user-email"
              type="email"
              className={inputClass}
              value={email}
              maxLength={255}
              placeholder="name@hotpoint.co.ke"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Name" htmlFor="add-user-name">
            <input
              id="add-user-name"
              className={inputClass}
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy || !email.trim() || !name.trim()}
            className={primaryButtonClass}
          >
            <Plus className="h-4 w-4" /> Add user
          </button>
        </div>
      </form>
    </Card>
  );
}
