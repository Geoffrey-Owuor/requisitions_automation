import { query } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const staffNumber = request.nextUrl.searchParams.get("staff_number");

  if (!staffNumber) {
    return NextResponse.json(
      { message: "Staff number is required" },
      { status: 400 },
    );
  }

  try {
    const result = await query(
      `SELECT staff_name, staff_email, 
       staff_department, staff_location
       FROM company_staff_data 
       WHERE staff_number = $1 
       LIMIT 1`,
      [staffNumber],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Staff information not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching staff data" },
      { status: 500 },
    );
  }
}
