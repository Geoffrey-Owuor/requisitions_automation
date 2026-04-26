type DirectorApprovalStageProps = {
  uuid: string;
  userEmail: string;
  hodEmail: string;
  hrEmail: string;
  status: string;
  approverEmail: string;
  approverName: string;
};
export function directorApprovalStage({
  uuid,
  userEmail,
  hodEmail,
  hrEmail,
  status,
  approverEmail,
  approverName,
}: DirectorApprovalStageProps) {}
