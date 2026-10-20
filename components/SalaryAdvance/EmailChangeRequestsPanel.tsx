"use client";

import { useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Mail,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  approveEmailChangeRequest,
  type EmailChangeRequestRow,
  type EmailChangeStatus,
  getEmailChangeRequestCounts,
  getEmailChangeRequests,
  rejectEmailChangeRequest,
} from "@/serverActions/EmailChangeRequestAdmin";
import { useServerPagination } from "@/hooks/useServerPagination";
import { useAlertStore } from "@/store/useAlertStore";
import { AlertDialog, useLastDefined } from "@/components/Modal";
import { TablePagination } from "@/components/Dashboard/TablePagination";
import { EmailChangeRequestsSkeleton } from "@/components/Skeletons/AdvanceHrSkeletons";

export const EMAIL_CHANGE_COUNTS_KEY = ["EmailChangeRequestCounts"];
const REQUESTS_KEY = ["EmailChangeRequests"];

const STATUS_TABS: { status: EmailChangeStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

const same = (a: string | null, b: string) =>
  (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

type Resolution = {
  request: EmailChangeRequestRow;
  outcome: "approve" | "reject";
};

export default function EmailChangeRequestsPanel() {
  const queryClient = useQueryClient();
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  const [status, setStatus] = useState<EmailChangeStatus>("open");
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: counts } = useQuery({
    queryKey: EMAIL_CHANGE_COUNTS_KEY,
    queryFn: getEmailChangeRequestCounts,
  });

  const {
    data: requests,
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
    queryKey: REQUESTS_KEY,
    params: { status },
    initialPageSize: 10,
    queryFn: ({ page, pageSize, searchTerm, params }) =>
      getEmailChangeRequests({ page, pageSize, searchTerm, ...params }),
  });

  const resolve = async (note: string) => {
    if (!resolution) return;
    setBusy(true);
    try {
      const action =
        resolution.outcome === "approve"
          ? approveEmailChangeRequest
          : rejectEmailChangeRequest;
      const result = await action(resolution.request.id, note);
      triggerAlert(result.ok ? "success" : "error", result.message);
      if (result.ok) {
        setResolution(null);
        queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
        queryClient.invalidateQueries({ queryKey: EMAIL_CHANGE_COUNTS_KEY });
        queryClient.invalidateQueries({ queryKey: ["StaffDirectory"] });
      }
    } catch {
      triggerAlert("error", "The change could not be saved, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-sm text-neutral-600">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
        Requests from the salary advance page to change the email on a staff
        record. They&apos;re unverified - confirm the requester&apos;s identity
        by phone or in person before approving.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Request status"
          className="rounded-control flex w-fit gap-1 border border-neutral-300 bg-white/60 p-1"
        >
          {STATUS_TABS.map((tab) => {
            const isActive = tab.status === status;
            const count = counts?.[tab.status] ?? 0;
            return (
              <button
                key={tab.status}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setStatus(tab.status);
                  setCurrentPage(1);
                }}
                className={`rounded-compact inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] leading-4.5 font-semibold ${
                      tab.status === "open"
                        ? "bg-red-600 text-white"
                        : isActive
                          ? "bg-white/20"
                          : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full max-w-xs">
          <Search
            className="absolute top-1/2 left-4 z-10 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            aria-label="Search requests"
            placeholder="Search staff number, name or email..."
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
          onClick={() => {
            refetch();
            queryClient.invalidateQueries({
              queryKey: EMAIL_CHANGE_COUNTS_KEY,
            });
          }}
          className="rounded-control inline-flex items-center gap-2 bg-slate-900 px-3 py-2.5 text-sm text-white hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <EmailChangeRequestsSkeleton />
      ) : isError ? (
        <div className="rounded-surface border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          The email change requests could not be loaded.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-surface border border-neutral-200 bg-white px-4 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-800">
            {isSearchActive
              ? "No matching requests"
              : status === "open"
                ? "You're all caught up"
                : `No ${status} requests yet`}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {isSearchActive
              ? `Nothing matches "${searchTerm}".`
              : status === "open"
                ? "No email change requests are waiting for review."
                : "Resolved requests will appear here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onResolve={(outcome) => setResolution({ request, outcome })}
            />
          ))}
        </ul>
      )}

      {totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
        />
      )}

      <ResolveDialog
        resolution={resolution}
        busy={busy}
        onClose={() => setResolution(null)}
        onConfirm={resolve}
      />
    </div>
  );
}

function Detail({
  label,
  value,
  flag,
}: {
  label: string;
  value: string | null;
  // Whether the on-file value matches what was submitted
  flag?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold text-neutral-500">{label}</dt>
      <dd className="flex items-center gap-1.5 truncate text-sm text-neutral-900">
        <span className="truncate">{value ?? "-"}</span>
        {flag !== undefined &&
          (flag ? (
            <Check
              aria-label="Matches the request"
              className="h-3.5 w-3.5 shrink-0 text-emerald-600"
            />
          ) : (
            <AlertTriangle
              aria-label="Differs from the request"
              className="h-3.5 w-3.5 shrink-0 text-amber-600"
            />
          ))}
      </dd>
    </div>
  );
}

function RequestCard({
  request,
  onResolve,
}: {
  request: EmailChangeRequestRow;
  onResolve: (outcome: Resolution["outcome"]) => void;
}) {
  const onFile = request.currentEmail !== null;

  return (
    <li className="rounded-surface space-y-3 border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {request.staffName}{" "}
            <span className="font-normal text-neutral-500">
              · {request.staffNumber}
            </span>
          </p>
          <p className="text-xs text-neutral-500">
            Submitted {request.submittedAt} · {request.reason}
          </p>
        </div>
        {request.status === "open" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onResolve("reject")}
              className="rounded-control border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-neutral-400"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={!onFile || !!request.emailUsedBy}
              title={
                !onFile
                  ? "This staff number isn't in the staff records"
                  : request.emailUsedBy
                    ? "Another staff record already uses this email"
                    : undefined
              }
              onClick={() => onResolve("approve")}
              className="rounded-control bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Approve &amp; apply
            </button>
          </div>
        ) : (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              request.status === "approved"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {request.status === "approved" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {request.status === "approved" ? "Approved" : "Rejected"}
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <dl className="rounded-control grid grid-cols-2 gap-2 bg-neutral-50 p-3">
          <p className="col-span-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
            Requested
          </p>
          <Detail label="Department" value={request.department} />
          <Detail label="New email" value={request.requestedEmail} />
        </dl>
        <dl className="rounded-control grid grid-cols-2 gap-2 bg-neutral-50 p-3">
          <p className="col-span-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
            On file now
          </p>
          {onFile ? (
            <>
              <Detail
                label="Name"
                value={request.currentName}
                flag={same(request.currentName, request.staffName)}
              />
              <Detail
                label="Department"
                value={request.currentDepartment}
                flag={same(request.currentDepartment, request.department)}
              />
              <div className="col-span-2">
                <Detail label="Email" value={request.currentEmail} />
              </div>
            </>
          ) : (
            <p className="col-span-2 text-sm text-rose-700">
              This staff number isn&apos;t in the staff records.
            </p>
          )}
        </dl>
      </div>

      {request.status === "open" && request.emailUsedBy && (
        <p className="rounded-control flex items-start gap-2 border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {request.requestedEmail} is already the email of {request.emailUsedBy}
          , so it can&apos;t be applied.
        </p>
      )}

      {request.status !== "open" && (
        <div className="border-t border-neutral-100 pt-3 text-xs text-neutral-600">
          <p>
            {request.status === "approved" ? "Approved" : "Rejected"} by{" "}
            {request.resolvedByName} on {request.resolvedAt}
            {request.previousEmail && ` · replaced ${request.previousEmail}`}
          </p>
          {request.resolutionNote && (
            <p className="mt-1 text-neutral-800">
              &ldquo;{request.resolutionNote}&rdquo;
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function ResolveDialog({
  resolution,
  busy,
  onClose,
  onConfirm,
}: {
  resolution: Resolution | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const titleId = useId();
  const messageId = useId();
  const noteId = useId();
  // Keep the last content while the dialog animates closed
  const shown = useLastDefined(resolution);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [shownFor, setShownFor] = useState<string | null>(null);

  // A fresh note and checkbox each time a request is opened for an action
  const openFor = resolution
    ? `${resolution.outcome}:${resolution.request.id}`
    : null;
  if (!openFor && shownFor) setShownFor(null);
  if (openFor && openFor !== shownFor) {
    setShownFor(openFor);
    setNote("");
    setConfirmed(false);
  }

  const isApprove = shown?.outcome === "approve";
  const ready = isApprove ? confirmed : note.trim().length > 0;

  return (
    <AlertDialog
      open={!!resolution}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={messageId}
    >
      <h2 id={titleId} className="text-base font-semibold text-neutral-900">
        {isApprove ? "Approve and apply this change?" : "Reject this request?"}
      </h2>
      <div id={messageId} className="mt-2 space-y-2 text-sm text-neutral-600">
        {shown &&
          (isApprove ? (
            <>
              <p>
                {shown.request.staffName}&apos;s email becomes{" "}
                <strong>{shown.request.requestedEmail}</strong>. They&apos;re
                emailed there, and their current address is told about the
                change.
              </p>
              <p className="text-amber-700">
                Also update it in the HR system - the next staff import
                overwrites this record.
              </p>
            </>
          ) : (
            <p>
              Nothing on the staff record changes. The requester is told it
              wasn&apos;t approved; your reason is kept here for HR, not sent.
            </p>
          ))}
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onConfirm(note);
        }}
      >
        {isApprove && (
          <label className="flex items-start gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-slate-900"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I&apos;ve confirmed the requester&apos;s identity by phone or in
            person
          </label>
        )}
        <div className="space-y-1">
          <label
            htmlFor={noteId}
            className="block text-xs font-medium text-neutral-600"
          >
            {isApprove ? "Note (optional)" : "Reason"}
          </label>
          <textarea
            id={noteId}
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-control w-full border border-neutral-200 p-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !ready}
            className={`rounded-control px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              isApprove
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isApprove ? "Approve & apply" : "Reject request"}
          </button>
        </div>
      </form>
    </AlertDialog>
  );
}
