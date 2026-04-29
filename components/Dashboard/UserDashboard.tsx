"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import { BriefcaseBusiness, Laptop, Monitor } from "lucide-react";
import SignOutButton from "../SignOutButton";
import UserCard from "../UserCard";
import { initialsHelper } from "@/public/assets";
import { IT_ARRAY } from "@/public/secretAssets";

const UserDashboard = () => {
  const { username, email: userEmail } = useUser();
  const userName = username ?? "Guest";
  const firstName = userName.split(" ")[0];

  // Check if the user is an admin
  const isITAdmin = IT_ARRAY.some(
    (itApprover) => itApprover.email === userEmail,
  );

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-6xl px-6">
        {/* WELCOME AREA */}
        <div className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
          {/* Welcome Text */}
          <div>
            <p className="mb-1 text-[13px] font-semibold tracking-[0.5px] text-rose-600 uppercase">
              Welcome back
            </p>
            <h1 className="text-lg font-semibold tracking-[-0.5px] text-[#1e1b1b]">
              Good to see you, {firstName} 👋
            </h1>
          </div>

          {/* User Card */}
          <div className="flex w-full items-center justify-between gap-4 md:w-auto">
            <SignOutButton />
            {/* User Card */}
            <UserCard
              initials={initialsHelper(userName)}
              userName={userName}
              userEmail={userEmail}
            />
          </div>
        </div>

        {/* DATA TABLES */}

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
            <ITRequisitionsTable userEmail={userEmail} isITAdmin={isITAdmin} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
