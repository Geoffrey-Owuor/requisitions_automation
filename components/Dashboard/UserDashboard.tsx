"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import { BriefcaseBusiness, Laptop, Monitor } from "lucide-react";
import { initialsHelper } from "@/public/assets";
import UserDropdown from "../UserDropDown";
import { useQuery } from "@tanstack/react-query";
import { loadITArray } from "@/lib/loadAppData";

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
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-6xl px-6">
        {/* WELCOME AREA */}
        <div className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
          {/* Welcome Text */}
          <div>
            <p className="mb-1 font-mono text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              Welcome aboard!
            </p>
            <h1 className="text-lg font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              {firstName}, look who showed up 👀
            </h1>
          </div>

          {/* User DropDown */}

          <UserDropdown
            initials={initialsHelper(userName)}
            userName={userName}
            userEmail={userEmail}
          />
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
