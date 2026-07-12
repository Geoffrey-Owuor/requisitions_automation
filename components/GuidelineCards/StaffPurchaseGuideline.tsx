import {
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  MousePointerClick,
  PackagePlus,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { GeneralNote, InfoCard } from "./GuidelinesPage";

export default function StaffPurchaseGuideline() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
          <ShoppingBag size={14} /> Staff Product Purchase
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          Staff Purchase Guidelines
        </h2>
        <p className="text-slate-500">
          Step-by-step procedures for navigating the portal, searching for
          products, and submitting a purchase request.
        </p>
      </div>

      {/* External Portal Tip Callout */}
      <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="rounded-full bg-blue-100 p-2 text-blue-600">
          <ExternalLink size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">
            Prefer a Full-Screen Experience?
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-blue-800">
            You can access the portal directly in a separate window.{" "}
            <Link
              href="https://192.168.0.155:4443"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 transition-colors hover:text-blue-600"
            >
              Open Staff Purchase Portal in a new tab
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Important Note Callout */}
      <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="rounded-full bg-amber-200/50 p-2 text-amber-700">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-amber-900">
            Special & Offer Pricing
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            If you are buying items on special or offer pricing, you{" "}
            <strong>
              must indicate this in the &quot;Other Details&quot; field
            </strong>
            . This ensures Credit Control and Invoicing process your purchase
            request with the correct discounted price.
          </p>
        </div>
      </div>

      {/* Required Fields Section */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <CheckCircle2 size={20} className="text-slate-600" />
          Submission Process
        </h3>
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
