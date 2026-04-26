type HrApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
  approvalTier: string;
};
export function hrApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  status,
  approverEmail,
  approverName,
  approvalTier,
}: HrApprovalStageProps) {}
