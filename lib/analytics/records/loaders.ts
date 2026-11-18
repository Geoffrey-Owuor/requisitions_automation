import "server-only";
import type { QueryResultRow } from "pg";
import type { PaginatedResult } from "@/lib/pagination";
import type { AnalyticsType } from "@/lib/analytics/definitions";
import type { RecordsArgs } from "./shared";
import { loadItRecords } from "./it";

// Dashboard type -> its Records loader, for app/api/analytics/[type]/records.
// Keep in step with ANALYTICS_RECORD_FILTERS in lib/analytics/records.ts.
export const ANALYTICS_RECORD_LOADERS: Partial<
  Record<
    AnalyticsType,
    (args: RecordsArgs) => Promise<PaginatedResult<QueryResultRow>>
  >
> = {
  it: loadItRecords,
};
