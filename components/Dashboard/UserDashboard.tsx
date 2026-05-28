"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import { BriefcaseBusiness, Laptop, Monitor, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadITArray } from "@/lib/loadAppDataV2";

const UserDashboard = () => {
  const { username, email: userEmail } = useUser();
  const userName = username ?? "Guest";
  const firstName = userName.split(" ")[0];

  const { data: IT_ARRAY = [] } = useQuery({
    queryKey: ["BaseITApproversData"],
    queryFn: loadITArray,
  });
  // Check if the user is an admin
  const isITAdmin =
    IT_ARRAY.length !== 0 &&
    IT_ARRAY.some((itApprover) => itApprover.email === userEmail);

  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl py-4">
        {/* WELCOME AREA */}
        <div className="flex flex-wrap items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
          {/* Welcome Text */}
          <div>
            <p className="mb-1 font-mono text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              Welcome!
            </p>
            <h1 className="text-lg font-semibold tracking-[-0.5px] text-[#1e1b1b]">
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
        {userEmail && (
          <div>
            <span className="my-4 flex items-center gap-2 font-medium text-neutral-600">
              <BriefcaseBusiness className="h-5 w-5" />
              Your Travel Requisitions
            </span>
            <TravelRequisitionsTable userEmail={userEmail} />
          </div>
        )}
        {/* User IT Requisitions */}
        {userEmail && (
          <div>
            <span className="my-4 flex items-center gap-2 font-medium text-neutral-600">
              <Monitor className="h-5 w-5" />
              Your IT Requisitions
            </span>
            <ITRequisitionsTable userEmail={userEmail} isITAdmin={false} />
          </div>
        )}
        {/* All IT Requisitions */}
        {isITAdmin && (
          <div>
            <span className="my-4 flex items-center gap-2 font-medium text-neutral-600">
              <Laptop className="h-5 w-5" />
              Submitted IT Requisitions
            </span>
            <ITRequisitionsTable isITAdmin={isITAdmin} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
