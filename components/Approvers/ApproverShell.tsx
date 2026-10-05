import { getSession } from "@/lib/session";
import PageShell from "../PageShell";
import AuthenticatedShell from "../Dashboard/AuthenticatedShell";
import RequisitionPagesWrapper from "../Dashboard/RequisitionPagesWrapper";

// Shell for the (approvers) pages. Access to the approval itself comes from
// the link's token, not the session, so the shell is chosen by the session
// alone: a signed-in visitor gets the normal dashboard shell under their own
// identity (the requisition forms submit as the session user); anyone else
// gets the public shell, with no requisition forms - every submission route
// needs a session - and a Login that brings them back to this page.
const ApproverShell = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();

  if (!session)
    return (
      <PageShell loginReturnsHere>
        <div className="flex flex-1 flex-col py-4">{children}</div>
      </PageShell>
    );

  return (
    <AuthenticatedShell session={session}>
      <RequisitionPagesWrapper>{children}</RequisitionPagesWrapper>
    </AuthenticatedShell>
  );
};

export default ApproverShell;
