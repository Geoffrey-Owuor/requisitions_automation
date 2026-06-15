import { Metadata } from "next";
import PurchaseIframeWrapper from "@/components/Iframes/PurchaseIframeWrapper";
import crypto from "crypto";
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
    redirect("/login");
  }

  // Get the user's email
  const userEmail = session.email;

  // 2. Generate the timestamp and signature
  const timestamp = Date.now().toString();
  const dataToSign = `${userEmail}:${timestamp}`;
  const secret = process.env.SSO_SHARED_SECRET!;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("hex");

  // 3. Construct the secure URL pointing to Nginx port 4443
  const ssoUrl = `${process.env.STAFFPURCHASE_LINK}/api/external/sso?email=${encodeURIComponent(userEmail)}&timestamp=${timestamp}&signature=${signature}`;

  return <PurchaseIframeWrapper ssoUrl={ssoUrl} />;
};

export default page;
