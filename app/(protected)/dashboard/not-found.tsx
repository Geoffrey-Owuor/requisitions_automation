import NotFoundCard from "@/components/NotFoundCard";

// notFound() under /dashboard - including unmatched dashboard URLs, via the
// [...missing] catch-all - renders here, so signed-in users keep the
// dashboard nav instead of getting the public 404.
export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col p-4">
      <NotFoundCard homeHref="/dashboard" homeLabel="Return to dashboard" />
    </div>
  );
}
