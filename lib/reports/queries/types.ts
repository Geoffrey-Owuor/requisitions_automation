import type { ReportStatusFilter } from "@/lib/reports/definitions";

// Already validated by the download route (getReportRangeError)
export type ReportQueryParams = {
  from: string;
  to: string;
  status: ReportStatusFilter;
};
