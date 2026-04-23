import { Suspense } from "react";
import { query } from "@/lib/db";
import { HOD_ARRAY } from "@/public/secretAssets";
import { HR_ARRAY } from "@/public/secretAssets";
import { DIRECTOR_ARRAY } from "@/public/secretAssets";
import DashboardWrapper from "@/components/Dashboard/DashboardWrapper";
import TravelApprovalModal from "./TravelApprovalModal";

type TravelApprovalWrapperProps = {
  uuid: string;
  token: string;
  stage: string;
};
const TravelApprovalWrapper = async ({
  uuid,
  token,
  stage,
}: TravelApprovalWrapperProps) => {
  return <div>TravelApprovalWrapper</div>;
};

export default TravelApprovalWrapper;
