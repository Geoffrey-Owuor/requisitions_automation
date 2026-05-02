import GuidelinesPage from "@/components/GuidelineCards/GuidelinesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Requisition Guidelines",
  description: "Guidelines for various requisition forms",
};
const page = () => {
  return <GuidelinesPage />;
};

export default page;
