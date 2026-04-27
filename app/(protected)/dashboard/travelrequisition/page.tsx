import { Metadata } from "next";
import TravelRequisitionPage from "@/components/TravelRequisitionPage";

export const metadata: Metadata = {
  title: "Travel Requisition",
  description: "The Travel Requisition Page",
};

const page = () => {
  return <TravelRequisitionPage />;
};

export default page;
