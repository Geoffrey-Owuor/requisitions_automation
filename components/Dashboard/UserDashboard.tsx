"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import DashboardWatermark from "../Modules/DashboardWaterMark";
import { useEffect } from "react";
import DashboardAlert from "./DashboardAlert";

const UserDashboard = () => {
  const { username, email: userEmail, roles } = useUser();

  // --- CACHE USER FOR QUICK SIGN-IN ---
  useEffect(() => {
    if (username && userEmail) {
      localStorage.setItem(
        "Requisitions_Automation_lastUser",
        JSON.stringify({ name: username, email: userEmail }),
      );
    }
  }, [username, userEmail]);

  // Check user active roles
  const isITAdmin = roles.includes("it");
  const isHod = roles.includes("hod");
  const isHr = roles.includes("hr");
  const isDirector = roles.includes("director");

  return (
    <div className="relative h-full p-4">
      {/* The dashboard alert */}
      <DashboardAlert />
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 flex -translate-x-1/2 items-center justify-center overflow-hidden lg:left-[calc(80px+(100vw-80px)/2)]">
        {/* ---------- WATERMARK LAYER ---------- */}
        <DashboardWatermark />
      </div>

      {/* 3. THE CONTENT LAYER */}

      <div className="relative z-10 space-y-4">
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
    </div>
  );
};

export default UserDashboard;
