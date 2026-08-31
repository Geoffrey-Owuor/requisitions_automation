import type { ComponentType } from "react";
import ITRequisitionGuideline from "./ITRequisitionGuideline";
import TravelRequisitionGuideline from "./TravelRequisitionGuideline";
import HelpdeskGuideline from "./HelpDeskGuideline";
import AccessRequisitionGuideline from "./AccessRequisitionGuideline";
import StaffPurchaseGuideline from "./StaffPurchaseGuideline";
import SalaryAdvanceGuideline from "./SalaryAdvanceGuideline";
import CasualRequisitionGuideline from "./CasualRequisitionGuideline";
import EmployeeRequisitionGuideline from "./EmployeeRequisitionGuideline";

/**
 * Guideline panel for each directory slug. Keys must stay in step with
 * `slug` in lib/appDirectory.tsx — `/guidelines/[slug]` 404s otherwise.
 *
 * Every panel is a server component, so none of this reaches the client bundle.
 */
export const guidelinePanels: Record<string, ComponentType> = {
  travel: TravelRequisitionGuideline,
  it: ITRequisitionGuideline,
  casual: CasualRequisitionGuideline,
  employee: EmployeeRequisitionGuideline,
  access: AccessRequisitionGuideline,
  advance: SalaryAdvanceGuideline,
  desk: HelpdeskGuideline,
  purchase: StaffPurchaseGuideline,
};
