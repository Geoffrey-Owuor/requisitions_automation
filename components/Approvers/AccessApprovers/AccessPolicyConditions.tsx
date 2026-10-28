import { AccessPolicy } from "@/lib/accessRequisition";

// The Key Custody & Access Policy conditions as the submitter agreed to them,
// shown on the approval page and the PDF preview
export default function AccessPolicyConditions({
  policy,
}: {
  policy: AccessPolicy;
}) {
  return (
    <div className="text-[13px] leading-relaxed text-[#5c4a4a]">
      <p className="mb-3 font-semibold text-[#1e1b1b]">{policy.intro}</p>
      <ol className="ml-4 flex list-decimal flex-col gap-1.5 pb-3">
        {policy.conditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ol>
      <p className="mt-2 font-semibold text-rose-700">{policy.warning}</p>
    </div>
  );
}
