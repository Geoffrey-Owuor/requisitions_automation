import { notFound } from "next/navigation";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

export const metadata = NOT_FOUND_METADATA;

// Unmatched URLs only reach the root not-found page; catching them here
// renders the dashboard's not-found inside the signed-in shell instead.
// Every real dashboard route is more specific, so it always wins.
export default function MissingDashboardPage() {
  notFound();
}
