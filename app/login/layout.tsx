import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  // If no session exists, redirect to the public login page
  if (session) {
    redirect("/dashboard");
  }
  return <>{children}</>;
};

export default layout;
