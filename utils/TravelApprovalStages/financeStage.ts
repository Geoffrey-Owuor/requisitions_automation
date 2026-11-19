import { loadFinanceArray } from "@/lib/loadApprovers";
import { EmailSender } from "@/services/EmailSender";

type FinanceEmailProps = Omit<Parameters<typeof EmailSender>[0], "to">;

// Travel's Finance notifications (final approval, push-back reversal or
// approval) go to every finance_array member. They're the same people
// canViewRequisition lets open the PDF (lib/requisitionAccess.ts). Finance
// never acts on a requisition, so the email carries no review link.
export async function emailTravelFinance(props: FinanceEmailProps) {
  const recipients = [
    ...new Set((await loadFinanceArray()).map((member) => member.email)),
  ];
  if (recipients.length === 0) {
    console.warn(
      `No finance_array members: travel requisition ${props.requestId} Finance email not sent`,
    );
    return;
  }
  await EmailSender({ ...props, to: recipients });
}
