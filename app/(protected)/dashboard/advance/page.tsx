import DashboardAdvanceWrapper from "@/components/SalaryAdvance/DashboardAdvanceWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotpoint Salary Advance",
  description: "Hotpoint salary advance page",
};

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) => {
  const { view } = await searchParams;
  return (
    <DashboardAdvanceWrapper
      view={typeof view === "string" ? view : undefined}
    />
  );
};
export default page;
