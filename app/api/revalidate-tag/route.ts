// An api endpoint for revalidating cached data on demand
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Get the current date and time
const date = new Date().toLocaleString();

export async function GET(request: NextRequest) {
  //define our search params and get the details
  const searchParams = request.nextUrl.searchParams;
  const tag = searchParams.get("tag");
  const secret = searchParams.get("secret");

  // security check
  if (!secret || !tag || secret !== process.env.REVALIDATE_TAG_KEY) {
    return NextResponse.json(
      { message: "Invalid provided params" },
      { status: 403 },
    );
  }

  //   Otherwise, perform the revalidation
  try {
    revalidateTag(tag, { expire: 0 });
    return NextResponse.json(
      { message: "Successful revalidation", time: date },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error while revalidating", error);
    return NextResponse.json(
      { message: "Error while revalidating" },
      { status: 500 },
    );
  }
}
