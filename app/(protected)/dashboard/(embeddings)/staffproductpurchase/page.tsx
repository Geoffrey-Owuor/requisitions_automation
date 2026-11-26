import { Metadata } from "next";
import PurchaseIframeWrapper from "@/components/Iframes/PurchaseIframeWrapper";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Staff Product Purchase",
  description: "Staff Product Purchase Embedded web app",
};

const page = async () => {
  // Retrieve the decoded jose JWT session data
  const session = await getSession();

  // If no session exists, block access and redirect to the public login page
  if (!session) {
    redirect("/login?returnTo=%2Fdashboard%2Fstaffproductpurchase");
  }

  // The SSO URL is signed by /api/embed/staffproductpurchase when the iframe
  // loads it, never baked into this page - back/forward navigation reuses the
  // rendered page and would replay an expired timestamp.
  return <PurchaseIframeWrapper ssoUrl="/api/embed/staffproductpurchase" />;
};

export default page;
