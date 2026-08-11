import {
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  MousePointerClick,
  PackagePlus,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import {
  Callout,
  GuidelineHeading,
  InfoCard,
  SectionTitle,
} from "./GuidelinesPage";

export default function StaffPurchaseGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <GuidelineHeading
        icon={<ShoppingBag size={13} />}
        eyebrow="Staff Product Purchase"
        title="Staff Purchase"
      >
        Step-by-step procedures for navigating the portal, searching for
        products, and submitting a purchase request.
      </GuidelineHeading>

      {/* External Portal Tip Callout */}
      <Callout
        icon={<ExternalLink size={18} />}
        title="Prefer a Full-Screen Experience?"
        tone="blue"
      >
        You can access the portal directly in a separate window.{" "}
        <Link
          href={"/staffproductpurchase/login"}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:text-blue-500"
        >
          Open Staff Purchase Portal in a new tab
        </Link>
        .
      </Callout>

      {/* Important Note Callout */}
      <Callout
        icon={<AlertCircle size={18} />}
        title="Special & Offer Pricing"
        tone="amber"
      >
        If you are buying items on special or offer pricing, you{" "}
        <strong className="font-semibold text-amber-900">
          must indicate this in the &quot;Other Details&quot; field
        </strong>
        . This ensures Credit Control and Invoicing process your purchase
        request with the correct discounted price.
      </Callout>

      {/* Required Fields Section */}
      <section className="space-y-5">
        <SectionTitle icon={<CheckCircle2 size={17} />}>
          Submission Process
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            icon={<MousePointerClick size={18} />}
            title="1. Navigation & Setup"
            items={[
              "Locate and click on “Purchase” on the left brownish sidebar.",
              "Navigate to the 'New Purchase' tab to start a fresh request.",
              "Enter all required personal information (Name, Payroll No).",
              "Provide transaction details like Invoicing Location and Payment Mode.",
            ]}
          />
          <InfoCard
            icon={<PackagePlus size={18} />}
            title="2. Products & Submission"
            items={[
              "Type the specific product code into the input field.",
              "Click the Search (lens) icon to the right of the input to retrieve the product's details.",
              "Add the retrieved products to your purchase list.",
              "Review all details carefully, then submit your request.",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
