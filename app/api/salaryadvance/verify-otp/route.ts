import { query } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json({ message: "OTP is required" }, { status: 400 });
    }

    const result = await query(
      `SELECT salary_advance_otp 
       FROM salary_advance_metadata 
       ORDER BY id 
       LIMIT 1`,
    );

    // Check if metadata row exists
    if (result.length === 0) {
      return NextResponse.json(
        { message: "System configuration error: OTP not set up" },
        { status: 500 },
      );
    }

    const currentActiveOtp = result[0].salary_advance_otp;

    // Compare the provided OTP with the database OTP
    // Using loose equality or converting both to strings to avoid Int vs String type mismatches
    if (String(otp) === String(currentActiveOtp)) {
      return NextResponse.json(
        { success: true, message: "OTP verified successfully" },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid OTP provided" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying the OTP" },
      { status: 500 },
    );
  }
}
