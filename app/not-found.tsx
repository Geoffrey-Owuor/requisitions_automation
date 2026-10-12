import PageShell from "@/components/PageShell";
import NotFoundCard from "@/components/NotFoundCard";

// Unmatched URLs anywhere, and notFound() outside the dashboard (which has
// its own, inside the signed-in shell)
export default function NotFound() {
  return (
    <PageShell width="narrow">
      <NotFoundCard homeHref="/" homeLabel="Return to homepage" />
    </PageShell>
  );
}
