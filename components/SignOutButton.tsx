// components/SignOutButton.tsx
import { signOut } from "@/lib/auth";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button className="text-sm font-medium hover:underline">Sign Out</button>
    </form>
  );
}
