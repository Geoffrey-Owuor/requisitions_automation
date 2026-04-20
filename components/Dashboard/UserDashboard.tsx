"use client";
import { useSession } from "next-auth/react";
import TravelRquisitionsTable from "./TravelRequisitionsTable";
import { BriefcaseBusiness } from "lucide-react";
import SignOutButton from "../SignOutButton";

const UserDashboard = () => {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Guest";
  const firstName = userName.split(" ")[0];

  const userEmail = session?.user?.email ?? "Not logged in";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
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
          <div className="flex items-center gap-4">
            <SignOutButton />
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 shadow-[0_8px_16px_rgba(160,60,60,0.06)] backdrop-blur-xl">
              {/* Initials Avatar */}
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,200,200,0.5)] bg-linear-to-br from-slate-800 to-rose-900 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>
              {/* Name & Email */}
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#1e1b1b]">
                  {userName}
                </span>
                <span className="text-[11px] text-[#a18080]">{userEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* THE TRAVEL REQUEST TABLE DATA */}
        {/* Heading */}
        <span className="my-4 flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4" />
          Your Travel Requisitions
        </span>
        <TravelRquisitionsTable userEmail={userEmail} />
      </div>
    </div>
  );
};

export default UserDashboard;
