import { Metadata } from "next";
import PurchaseIframeWrapper from "@/components/Iframes/PurchaseIframeWrapper";
import crypto from "crypto";
import HardRedirect from "@/components/HardRedirect";
import { getSession } from "@/lib/session";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Staff Product Purchase",
  description: "Staff Product Purchase Embedded web app",
};

const page = async () => {
  // Get the passed in base url to construct the right embedded app url to go to
  const headerList = await headers();

  // 1. Inspect headers sent by Nginx, falling back to local headers if accessed directly
  const proto = headerList.get("x-forwarded-proto") || "http";
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "127.0.0.1:4000";

  // 2. Mathematically construct the exact base URL the user is currently using
  const baseUrl = `${proto}://${host}`;

  // Retrieve the decoded jose JWT session data
  const session = await getSession();

  // If no session exists, block access and redirect to the public login page
  if (!session) {
    return <HardRedirect url="/api/auth/login" />;
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
  const ssoUrl = `${baseUrl}/staffproductpurchase/api/external/sso?email=${encodeURIComponent(userEmail)}&timestamp=${timestamp}&signature=${signature}`;

  return <PurchaseIframeWrapper ssoUrl={ssoUrl} />;
};

export default page;
