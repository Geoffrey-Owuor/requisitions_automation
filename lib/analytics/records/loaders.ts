import "server-only";
import type { QueryResultRow } from "pg";
import type { PaginatedResult } from "@/lib/pagination";
import type { AnalyticsType } from "@/lib/analytics/definitions";
import type { RecordsArgs } from "./shared";
import { loadCasualRecords } from "./casual";
import { loadEmployeeRecords } from "./employee";
import { loadItRecords } from "./it";
import { loadTravelRecords } from "./travel";

// Dashboard type -> its Records loader, for app/api/analytics/[type]/records.
// Keep in step with ANALYTICS_RECORD_FILTERS in lib/analytics/records.ts.
export const ANALYTICS_RECORD_LOADERS: Partial<
  Record<
    AnalyticsType,
    (args: RecordsArgs) => Promise<PaginatedResult<QueryResultRow>>
  >
> = {
  travel: loadTravelRecords,
  casual: loadCasualRecords,
  employee: loadEmployeeRecords,
  it: loadItRecords,
};
