import Image, { StaticImageData } from "next/image";

// Shown by the Travel/Casual/Employee amend forms while the requisition being
// amended loads. The form image and heading don't depend on that data, so
// they render for real; only the notice and the form card pulse. Mirrors the
// forms' first step (image, header, amendment notice, form card) so nothing
// jumps when the form replaces it.
export function RequisitionFormSkeleton({
  image,
  title,
  subtitle,
  sections = [5, 4],
}: {
  image: StaticImageData;
  title: string;
  subtitle: string;
  // Field count per form section
  sections?: number[];
}) {
  return (
    <div className="relative z-10 mx-auto max-w-225" aria-busy="true">
      <div className="rounded-surface sm:rounded-surface mb-4 overflow-hidden">
        <Image
          src={image}
          sizes="100vh"
          className="rounded-control object-contain object-center"
          priority
          alt="Form Image"
        />
      </div>
      <header className="mb-8">
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.5px] text-[#1e1b1b]">
          {title}
        </h1>
        <p className="mt-1 text-[14px] text-[#7c5a5a]">{subtitle}</p>
      </header>

      <div className="animate-pulse" aria-hidden="true">
        {/* Amendment notice */}
        <div className="rounded-surface mb-6 space-y-2 border border-amber-100 bg-amber-50/60 px-4 py-4">
          <div className="h-3 w-full rounded-full bg-amber-100" />
          <div className="h-3 w-11/12 rounded-full bg-amber-100" />
          <div className="h-3 w-2/3 rounded-full bg-amber-100" />
        </div>

        {/* Form card */}
        <div className="rounded-surface space-y-8 border border-white/85 bg-white/65 px-6 py-8 shadow-[0_24px_48px_rgba(160,60,60,0.10)] sm:px-8">
          {sections.map((fields, s) => (
            <div key={s}>
              <div className="mb-5 h-3.5 w-36 rounded-full bg-rose-100" />
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                {Array.from({ length: fields }, (_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-3 w-24 rounded-full bg-neutral-200/80" />
                    <div className="rounded-control h-10 border border-[rgba(240,180,180,0.4)] bg-white/80" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <div className="rounded-control h-11 w-40 bg-neutral-200/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
