import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const {} = await request.json();
  } catch (error) {}
}
