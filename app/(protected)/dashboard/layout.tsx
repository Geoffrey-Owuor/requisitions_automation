// app/(protected)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import DashboardHeader from "@/components/DashboardHeader";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If no session exists, redirect to the public login page
  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
