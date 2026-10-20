"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import {
  deactivateStaffRecord,
  getStaffDirectory,
  getStaffDirectoryOptions,
  reactivateStaffRecord,
  saveStaffRecord,
  type StaffRecord,
} from "@/serverActions/StaffDirectoryAdmin";
import { useServerPagination } from "@/hooks/useServerPagination";
import { useAlertStore } from "@/store/useAlertStore";
import { Modal, useLastDefined } from "@/components/Modal";
import { Select } from "@/components/Select";
import { TablePagination } from "@/components/Dashboard/TablePagination";
import { SkeletonTable } from "@/components/Skeletons/SkeletonTable";
import {
  ConfirmDialog,
  type Confirmation,
  smallButtonClass,
  StatusBadge,
  useSettingsRunner,
} from "@/components/Settings/SettingsPrimitives";

const DIRECTORY_KEY = ["StaffDirectory"];

const inputClass =
  "rounded-control h-10 w-full border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-slate-900";

// null = closed, "new" = adding, a record = editing it
type Editing = StaffRecord | "new" | null;

export default function StaffDirectoryPanel() {
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const { busy, run } = useSettingsRunner(DIRECTORY_KEY, []);

  const {
    data: staff,
    totalCount,
    isLoading,
    isError,
    refetch,
    searchTerm,
    setSearchTerm,
    clearSearch,
    isSearchActive,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  } = useServerPagination({
    queryKey: DIRECTORY_KEY,
    params: {},
    initialPageSize: 10,
    queryFn: ({ page, pageSize, searchTerm }) =>
      getStaffDirectory({ page, pageSize, searchTerm }),
  });

  return (
    <div className="space-y-4">
      <p className="rounded-control flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        These records are imported from the HR system, and the next import
        replaces any change made here. Use this for fixes that can&apos;t wait,
        and make the same change in the HR system. Deactivating a record stops
        that person verifying for a salary advance and using Staff Product
        Purchase.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute top-1/2 left-4 z-10 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            aria-label="Search staff"
            placeholder="Search number, name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-control w-full border border-gray-300 bg-white/60 py-2.5 pr-10 pl-11 text-sm outline-hidden transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/5"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="rounded-compact absolute top-1/2 right-3 z-10 -translate-y-1/2 p-1 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-control inline-flex items-center gap-2 bg-slate-900 px-3 py-2.5 text-sm text-white hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-control inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 hover:border-neutral-400"
        >
          <Plus className="h-4 w-4" />
          Add staff
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable />
      ) : isError ? (
        <div className="rounded-surface border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          The staff directory could not be loaded.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-surface border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
          {isSearchActive
            ? `No staff match "${searchTerm}".`
            : "There are no staff records yet."}
        </div>
      ) : (
        <div className="rounded-surface overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                <th className="px-4 py-3">Staff no.</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {staff.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-700">
                    {record.staffNumber}
                  </td>
                  <td
                    className={`px-4 py-2.5 ${record.deactivation ? "text-neutral-400" : "text-neutral-900"}`}
                  >
                    {record.name}
                    {record.openRequests > 0 && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Email change open
                      </span>
                    )}
                    {record.deactivation && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Deactivated {record.deactivation.at} by{" "}
                        {record.deactivation.byEmail} ·{" "}
                        {record.deactivation.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {record.email}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {record.department}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {record.location}
                  </td>
                  <td className="px-4 py-2.5">
                    {record.deactivation ? (
                      <StatusBadge tone="grey">Inactive</StatusBadge>
                    ) : (
                      <StatusBadge tone="green">Active</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${record.name}`}
                        onClick={() => setEditing(record)}
                        className="rounded-compact p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {record.deactivation ? (
                        <button
                          type="button"
                          disabled={busy}
                          className={smallButtonClass}
                          onClick={() =>
                            setConfirmation({
                              title: `Reactivate ${record.name}?`,
                              message: `${record.name} (${record.staffNumber}) will be able to verify for a salary advance and use Staff Product Purchase again.`,
                              confirmLabel: "Reactivate",
                              action: () => reactivateStaffRecord(record.id),
                            })
                          }
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className={smallButtonClass}
                          onClick={() =>
                            setConfirmation({
                              title: `Deactivate ${record.name}?`,
                              message: `${record.name} (${record.staffNumber}) won't be able to verify for a salary advance, and can't register or sign in on Staff Product Purchase. Their existing requests are kept.`,
                              confirmLabel: "Deactivate",
                              input: { label: "Reason", maxLength: 500 },
                              action: (reason) =>
                                deactivateStaffRecord(record.id, reason),
                            })
                          }
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      )}

      <StaffRecordModal editing={editing} onClose={() => setEditing(null)} />
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

const EMPTY_FORM = {
  staffNumber: "",
  name: "",
  email: "",
  department: "",
  location: "",
};

function StaffRecordModal({
  editing,
  onClose,
}: {
  editing: Editing;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  // Keep the last content while the modal animates closed
  const shown = useLastDefined(editing);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formFor, setFormFor] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);

  const { data: options } = useQuery({
    queryKey: ["StaffDirectoryOptions"],
    queryFn: getStaffDirectoryOptions,
    enabled: editing !== null,
  });

  // Load the record (or a blank form) each time the modal opens
  if (editing !== null && editing !== formFor) {
    setFormFor(editing);
    setForm(
      editing === "new"
        ? EMPTY_FORM
        : {
            staffNumber: editing.staffNumber,
            name: editing.name,
            email: editing.email,
            department: editing.department,
            location: editing.location,
          },
    );
  }
  if (editing === null && formFor !== null) setFormFor(null);

  const isNew = shown === "new";
  const ready = Object.values(form).every((value) => value.trim());
  const set =
    (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      const result = await saveStaffRecord({
        id: isNew || !shown ? null : shown.id,
        ...form,
      });
      triggerAlert(result.ok ? "success" : "error", result.message);
      if (result.ok) {
        onClose();
        queryClient.invalidateQueries({ queryKey: DIRECTORY_KEY });
        queryClient.invalidateQueries({ queryKey: ["StaffDirectoryOptions"] });
        queryClient.invalidateQueries({ queryKey: ["EmailChangeRequests"] });
      }
    } catch {
      triggerAlert("error", "The change could not be saved, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={editing !== null}
      onClose={onClose}
      title={isNew ? "Add a staff record" : "Edit staff record"}
      subtitle="Make the same change in the HR system, or the next import undoes it."
      icon={<UsersRound className="h-4 w-4" />}
      widthClassName="sm:max-w-lg"
      bodyClassName="p-5 sm:p-6"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="staff-record-form"
            disabled={busy || !ready}
            className="rounded-control bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isNew ? "Add staff" : "Save changes"}
          </button>
        </>
      }
    >
      <form
        id="staff-record-form"
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) save();
        }}
      >
        <Field label="Staff number" id="staff-number">
          <input
            id="staff-number"
            className={inputClass}
            value={form.staffNumber}
            maxLength={150}
            onChange={set("staffNumber")}
          />
        </Field>
        <Field label="Name" id="staff-name">
          <input
            id="staff-name"
            className={inputClass}
            value={form.name}
            maxLength={255}
            onChange={set("name")}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email" id="staff-email">
            <input
              id="staff-email"
              type="email"
              className={inputClass}
              value={form.email}
              maxLength={255}
              onChange={set("email")}
            />
          </Field>
        </div>
        <Field label="Department" id="staff-department">
          {/* Active departments only; an edit keeps showing a record's
              current department even if it isn't one of them */}
          <Select
            id="staff-department"
            tone="slate"
            value={form.department}
            onChange={(department) =>
              setForm((current) => ({ ...current, department }))
            }
            options={(options?.departments ?? []).map((value) => ({
              value,
              label: value,
            }))}
            unlistedLabel={form.department}
            placeholder="Select a department"
            busy={!options}
          />
        </Field>
        <Field label="Location" id="staff-location">
          <input
            id="staff-location"
            list="staff-locations"
            className={inputClass}
            value={form.location}
            maxLength={255}
            onChange={set("location")}
          />
          <datalist id="staff-locations">
            {options?.locations.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </Field>
        <p className="rounded-control flex items-start gap-2 border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 sm:col-span-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Please double-check these details before saving. Other company apps
          use this record to confirm who someone is - for example to let them
          register on Staff Product Purchase - so a wrong email or staff number
          can lock the right person out or let the wrong person in.
        </p>
        {!isNew && (
          <p className="text-xs text-neutral-500 sm:col-span-2">
            Changing the email stops any unused verification codes sent to the
            old one.
          </p>
        )}
      </form>
    </Modal>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-neutral-600"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
