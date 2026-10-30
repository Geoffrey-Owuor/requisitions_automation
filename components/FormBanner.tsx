import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
import travel from "@/public/travel_form_image.webp";
import it from "@/public/it_form_image.webp";
import access from "@/public/access_form_image.webp";
import staffing from "@/public/staffing_form_image.webp";
import advance from "@/public/advance_form_image.webp";

// The decorative banner at the top of each requisition form and approval
// page. Casual and Employee share one.
const FORM_BANNERS = {
  travel,
  it,
  access,
  casual: staffing,
  employee: staffing,
  advance,
};

export type FormBannerType = keyof typeof FORM_BANNERS;

// The banner is at most max-w-225 (900px) wide, full width below that
const SIZES = "(min-width: 900px) 900px, 100vw";

export function FormBanner({ type }: { type: FormBannerType }) {
  return (
    <div className="rounded-surface mb-4 overflow-hidden">
      <Image
        src={FORM_BANNERS[type]}
        sizes={SIZES}
        className="rounded-control object-contain object-center"
        placeholder="blur"
        preload
        alt=""
      />
    </div>
  );
}

// Starts downloading a banner at low priority, so the form a page links to
// shows it straight away. Uses the same srcset and sizes as FormBanner, so
// the browser picks the same file and finds it cached.
export function preloadFormBanner(type: FormBannerType) {
  const { props } = getImageProps({
    src: FORM_BANNERS[type],
    sizes: SIZES,
    alt: "",
  });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "low",
  });
}
