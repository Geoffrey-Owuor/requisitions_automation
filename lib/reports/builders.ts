import "server-only";
import type { ReportType } from "@/lib/reports/definitions";
import type { ReportSheet } from "@/lib/reports/workbook";
import type { ReportQueryParams } from "./queries/types";
import { buildTravelReport } from "./queries/travel";
import { buildITReport } from "./queries/it";
import { buildAccessReport } from "./queries/access";
import { buildCasualReport } from "./queries/casual";
import { buildEmployeeReport } from "./queries/employee";
import { buildAdvanceReport } from "./queries/advance";

export const REPORT_BUILDERS: Record<
  ReportType,
  (params: ReportQueryParams) => Promise<ReportSheet[]>
> = {
  travel: buildTravelReport,
  it: buildITReport,
  access: buildAccessReport,
  casual: buildCasualReport,
  employee: buildEmployeeReport,
  advance: buildAdvanceReport,
};
