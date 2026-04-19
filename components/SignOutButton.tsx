import { SignOut } from "@/serverActions/SignOut";

export default function SignOutButton() {
  return (
    <form action={SignOut}>
      <button className="text-sm cursor-pointer underline">Sign Out</button>
    </form>
  );
}
