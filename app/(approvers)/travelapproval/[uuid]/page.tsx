import { Suspense } from "react";
import { query } from "@/lib/db";
import { HOD_ARRAY } from "@/public/secretAssets";
import { HR_ARRAY } from "@/public/secretAssets";
import { DIRECTOR_ARRAY } from "@/public/secretAssets";
import { Metadata } from "next";

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
    title: `${upperCase} Stage`,
    description: `${upperCase} Approval Stage`,
  };
};

const page = async () => {
  return <div>page</div>;
};

export default page;
