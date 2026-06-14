"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import { BriefcaseBusiness, Mail } from "lucide-react";

const UserDashboard = () => {
  const { username, email: userEmail, roles } = useUser();
  const firstName = username.split(" ")[0];

  // Check user active roles
  const isITAdmin = roles.includes("it");
  const isHod = roles.includes("hod");

  return (
    <div className="p-4">
      {/* WELCOME AREA */}
      <div className="flex flex-wrap items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
        {/* Welcome Text */}
        <div>
          <p className="mb-1 font-mono text-[14px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
            Welcome!
          </p>
          <h1 className="text-sm font-semibold tracking-[-0.5px] text-[#1e1b1b]">
            {firstName}, look who showed up 👀
          </h1>
        </div>

        {/* Microsoft Outlook Link */}
        <a
          href="https://outlook.office.com/mail/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/60 px-4 py-2 text-[13px] font-medium text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-xs transition-all duration-200 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-700 hover:shadow-xs active:scale-95"
        >
          <Mail
            size={15}
            className="text-neutral-600 transition-colors group-hover:text-rose-500"
          />
          <span>Open Outlook</span>
        </a>
      </div>

      {/* DATA TABLES */}

      {/* User Travel Requisitions */}
      <div>
        <span className="my-4 flex items-center gap-2 font-medium text-neutral-600">
          <BriefcaseBusiness className="h-5 w-5" />
          Your Travel Requisitions
        </span>
        <TravelRequisitionsTable userEmail={userEmail} />
      </div>

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
  );
};

export default UserDashboard;
