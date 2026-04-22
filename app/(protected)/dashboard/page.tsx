import UserDashboard from "@/components/Dashboard/UserDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User requisitions dashboard",
};

const page = () => {
  return <UserDashboard />;
};

export default page;
