import ApproverShell from "@/components/Approvers/ApproverShell";
import AccessApprovalSkeleton from "@/components/Skeletons/AccessApprovalSkeleton";

// Shown while the page loads the requisition on the server. ApproverShell
// reads the session, so the skeleton already sits in the frame the page will
// render in (dashboard shell when signed in, public shell otherwise).
export default function Loading() {
  return (
    <ApproverShell>
      <AccessApprovalSkeleton />
    </ApproverShell>
  );
}
