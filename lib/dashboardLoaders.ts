import "server-only";
import { QueryResultRow } from "pg";
import { PaginatedResult } from "@/lib/pagination";
import type { DashboardRequisitionType } from "@/lib/dashboardApi";
import { getTravelRequisitionData } from "@/serverActions/GetTravelRequisitionData";
import { getITRequisitionData } from "@/serverActions/GetITRequisitionData";
import { getAccessRequisitionData } from "@/serverActions/GetAccessRequisitionData";
import { getCasualRequisitionData } from "@/serverActions/GetCasualRequisitionData";
import { getEmployeeRequisitionData } from "@/serverActions/GetEmployeeRequisitionData";

// The dashboard's table loaders, keyed by requisition type, shared by the
// table and summary routes under app/api/dashboard/. Each loader does its
// own session and role/membership checks.

export type LoadArgs = { page: number; pageSize: number; searchTerm: string };
type Loader = (
  dataFlag: string,
  args: LoadArgs,
) => Promise<PaginatedResult<QueryResultRow>> | null;

// Binds a loader to the flags it accepts; unknown flags return null.
function loader<F extends string>(
  flags: readonly F[],
  load: (
    args: LoadArgs & { dataFlag: F },
  ) => Promise<PaginatedResult<QueryResultRow>>,
): Loader {
  return (dataFlag, args) =>
    (flags as readonly string[]).includes(dataFlag)
      ? load({ ...args, dataFlag: dataFlag as F })
      : null;
}

const LOADERS: Record<DashboardRequisitionType, Loader> = {
  travel: loader(
    ["userData", "hodPending", "hrPending", "directorPending", "history"],
    getTravelRequisitionData,
  ),
  it: loader(
    ["userData", "hodPending", "itPending", "itAll", "history"],
    getITRequisitionData,
  ),
  access: loader(
    ["userData", "hodPending", "securityPending", "history"],
    getAccessRequisitionData,
  ),
  casual: loader(
    ["userData", "hodPending", "hrPending", "history"],
    getCasualRequisitionData,
  ),
  employee: loader(
    [
      "userData",
      "hodPending",
      "retailDirectorPending",
      "directorPending",
      "hrPending",
      "history",
    ],
    getEmployeeRequisitionData,
  ),
};

export const isDashboardRequisitionType = (
  type: string,
): type is DashboardRequisitionType => Object.hasOwn(LOADERS, type);

// null when the type has no such flag
export function loadDashboardTable(
  type: DashboardRequisitionType,
  dataFlag: string,
  args: LoadArgs,
) {
  return LOADERS[type](dataFlag, args);
}
