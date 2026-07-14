import GuidelinesPage from "@/components/GuidelineCards/GuidelinesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guidelines",
  description: "Guidelines for various apps and online forms",
};
const page = () => {
  return <GuidelinesPage />;
};

export default page;
