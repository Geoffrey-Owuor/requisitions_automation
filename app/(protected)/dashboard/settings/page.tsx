import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import { canManageSettings } from "@/lib/configAdmin";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import SettingsPage from "@/components/Settings/SettingsPage";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage the app configuration",
};

// Only for config-admin holders; the nav hides the link from everyone else,
// and every Settings action re-checks the role
const page = async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  const roles = await getUserRoles(session.email);
  if (!canManageSettings(roles)) redirect("/dashboard");

  return (
    <RequisitionPagesWrapper>
      <SettingsPage />
    </RequisitionPagesWrapper>
  );
};

export default page;
