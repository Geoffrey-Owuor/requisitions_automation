"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import {
  BriefcaseBusiness,
  LucideIcon,
  Mail,
  Monitor,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import DashboardAlert from "./DashboardAlert";

const quickLinks: { icon: LucideIcon; link: string; title: string }[] = [
  {
    icon: Monitor,
    link: "/dashboard/itrequisition",
    title: "IT Requisition",
  },
  {
    icon: BriefcaseBusiness,
    link: "/dashboard/travelrequisition",
    title: "Travel Requisition",
  },
  {
    icon: ShoppingBag,
    link: "/dashboard/staffproductpurchase",
    title: "Staff Product Purchase",
  },
];

const UserDashboard = () => {
  const { username, email: userEmail, roles } = useUser();
  const firstName = username.split(" ")[0];

  // Check user active roles
  const isITAdmin = roles.includes("it");
  const isHod = roles.includes("hod");
  const isHr = roles.includes("hr");
  const isDirector = roles.includes("director");

  return (
    <>
      {/* Welcome message alert */}
      <DashboardAlert />

      <div className="p-4">
        {/* WELCOME AREA */}
        <div className="flex flex-wrap items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
          {/* Welcome Text */}
          <div>
            <p className="mb-1 font-mono text-[14px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              Howdy!
            </p>
            <h1 className="text-sm font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              {firstName}, look who showed up 👀
            </h1>
          </div>

          {/* Microsoft Outlook Link and Quick Dashboard Links */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2">
              {quickLinks.map(({ icon: Icon, link, title }, index) => (
                <Link
                  key={index}
                  href={link}
                  title={title}
                  className="rounded-full p-2 hover:bg-rose-50 hover:text-rose-800"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <a
              href="https://outlook.cloud.microsoft/mail/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl border border-neutral-300 bg-white/60 px-4 py-2 text-[13px] font-medium text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-xs transition-all duration-200 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-700 hover:shadow-xs active:scale-95"
            >
              <Mail
                size={15}
                className="text-neutral-600 transition-colors group-hover:text-rose-500"
              />
              <span>Outlook</span>
            </a>
          </div>
        </div>

        {/* ----------DATA TABLES------------ */}

        {/* TRAVEL REQUISITIONS */}

        {/* User Travel Requisitions */}
        <TravelRequisitionsTable dataFlag="userData" userEmail={userEmail} />

        {/* Travel Requisitions Pending HOD Approval */}
        {isHod && (
          <TravelRequisitionsTable dataFlag="hodPending" hodEmail={userEmail} />
        )}

        {/* Travel Requisitions Pending HR Approval */}
        {isHr && <TravelRequisitionsTable dataFlag="hrPending" />}

        {/* Travel Requisitions Pending Director Approval */}
        {isDirector && <TravelRequisitionsTable dataFlag="directorPending" />}

        {/* IT REQUISITIONS */}

        {/* User IT Requisitions */}
        <ITRequisitionsTable dataFlag="userData" userEmail={userEmail} />

        {/* IT Requisitions Pending HOD Approval */}
        {isHod && (
          <ITRequisitionsTable dataFlag="hodPending" hodEmail={userEmail} />
        )}

        {/* IT Requisitions Pending IT Approval */}
        {isITAdmin && <ITRequisitionsTable dataFlag="itPending" />}

        {/* All IT Requisitions */}
        {isITAdmin && <ITRequisitionsTable dataFlag="itAll" />}
      </div>
    </>
  );
};

export default UserDashboard;
