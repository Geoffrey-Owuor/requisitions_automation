import type { Metadata } from "next";

// not-found.tsx can't export metadata, so pages that call notFound() under
// /dashboard return this as their own (the dashboard [...missing] catch-all,
// and the amend pages for a malformed id) to give the 404 its tab title.
export const NOT_FOUND_METADATA: Metadata = { title: "Page Not Found" };
