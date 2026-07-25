"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";

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
    <div className="p-4">
      {/* The dashboard alert */}
      <DashboardAlert />

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
  );
};

export default UserDashboard;
