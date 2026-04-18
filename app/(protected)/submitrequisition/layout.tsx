// app/(protected)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b flex justify-between items-center">
        <span>
          Logged in as: {session.user?.email} {session.user?.name}
        </span>
        {/* Implement a sign-out button here */}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
