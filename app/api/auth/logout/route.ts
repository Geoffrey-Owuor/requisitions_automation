// app/api/auth/logout/route.ts
import { deleteSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  // 1. Destroy the jose JWT session cookie
  await deleteSession();

  // Return a success response
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}
