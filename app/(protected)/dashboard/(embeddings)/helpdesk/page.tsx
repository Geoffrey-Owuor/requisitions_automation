import { Metadata } from "next";
import HelpDeskIframeWrapper from "@/components/Iframes/HelpDeskIframeWrapper";
import HardRedirect from "@/components/HardRedirect";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Hotpoint HelpDesk",
  description: "Hotpoint internal helpdesk system",
};

const page = async () => {
  // Retrieve the decoded jose JWT session data
  const session = await getSession();

  // If no session exists, block access and redirect to the public login page
  if (!session) {
    return <HardRedirect url="/api/auth/login" />;
  }

  // The SSO URL is signed by /api/embed/helpdesk when the iframe loads it,
  // never baked into this page - back/forward navigation reuses the rendered
  // page and would replay an expired timestamp.
  return <HelpDeskIframeWrapper ssoUrl="/api/embed/helpdesk" />;
};

export default page;
