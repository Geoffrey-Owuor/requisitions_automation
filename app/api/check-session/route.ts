import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (session && session.email) {
      //Session is valid
      return NextResponse.json({ loggedIn: true, email: session.email });
    } else {
      //Session is invalid
      return NextResponse.json({ loggedIn: false, email: null });
    }
  } catch (error) {
    //An error occurred during session validation - treated as log out
    console.error(
      "Session validation error while checking user session:",
      error,
    );
    return NextResponse.json({ loggedIn: false, email: null });
  }
}
