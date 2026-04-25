type HodApprovalStageProps = {
  uuid: string;
  userEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
  approvalTier: string;
};
export function hodApprovalStage({
  uuid,
  userEmail,
  status,
  approverEmail,
  approverName,
  approvalTier,
}: HodApprovalStageProps) {}
