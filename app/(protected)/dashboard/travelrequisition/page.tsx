import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travel Requisition",
  description: "The Travel Requisition Page",
};
import TravelRequisitionPage from "@/components/TravelRequisitionPage";
const page = () => {
  return <TravelRequisitionPage />;
};

export default page;
