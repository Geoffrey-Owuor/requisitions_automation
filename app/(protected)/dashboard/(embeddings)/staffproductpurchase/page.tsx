import { Metadata } from "next";
import PurchaseIframeWrapper from "@/components/Iframes/PurchaseIframeWrapper";

export const metadata: Metadata = {
  title: "Staff Product Purchase",
  description: "Staff Product Purchase Emmbedded web app",
};
const page = () => {
  return <PurchaseIframeWrapper />;
};

export default page;
