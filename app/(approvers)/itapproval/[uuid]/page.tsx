import { Metadata } from "next";
import ITApprovalWrapper from "@/components/Approvers/ITApprovers/ITApprovalWrapper";

type ApprovalPageProps = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ token: string; stage: string }>;
};

// Generating page metadata
export const generateMetadata = async ({
  searchParams,
}: ApprovalPageProps): Promise<Metadata> => {
  const { stage } = await searchParams;
  const upperCase = stage.toUpperCase();
  return {
    title: `Review | ${upperCase || "NO"} Stage`,
    description: `Review | ${upperCase || "NO"} Approval Stage`,
  };
};

const page = async ({ params, searchParams }: ApprovalPageProps) => {
  const { uuid } = await params;
  const { token, stage } = await searchParams;

  return <ITApprovalWrapper uuid={uuid} token={token} stage={stage} />;
};

export default page;
