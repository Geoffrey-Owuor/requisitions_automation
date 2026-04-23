import { Metadata } from "next";
import TravelApprovalWrapper from "@/components/Approvers/TravelApprovers/TravelApprovalWrapper";

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
    title: `${upperCase || "NO"} Stage`,
    description: `${upperCase || "NO"} Approval Stage`,
  };
};

const page = async ({ params, searchParams }: ApprovalPageProps) => {
  const { uuid } = await params;
  const { token, stage } = await searchParams;

  return <TravelApprovalWrapper uuid={uuid} token={token} stage={stage} />;
};

export default page;
