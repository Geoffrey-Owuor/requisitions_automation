import { Metadata } from "next";
import ITRequisitionPage from "@/components/ITRequisition/ITRequisitionPage";

export const metadata: Metadata = {
  title: "IT Requisition",
  description: "The IT Requisition Page",
};

const page = () => {
  return <ITRequisitionPage />;
};

export default page;
