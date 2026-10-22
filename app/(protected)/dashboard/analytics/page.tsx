import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  analyticsHref,
  getAllowedAnalytics,
} from "@/lib/analytics/definitions";

// The nav's Analytics link: opens the first dashboard the viewer may see
const page = async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  const allowed = getAllowedAnalytics(await getUserRoles(session.email));
  redirect(allowed.length > 0 ? analyticsHref(allowed[0].type) : "/dashboard");
};

export default page;
