"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import DashboardWatermark from "../Modules/DashboardWaterMark";
import DashboardWelcome from "./DashboardWelcome";
import { useEffect, useMemo, useState } from "react";
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

  // --- TRACK WHETHER THE CURRENTLY RENDERED TABLES HAVE ANY DATA ---
  // Each table reports its own load state once fetched; once every table
  // relevant to this user's roles has reported and none has data, we know
  // the dashboard is empty and can show a welcoming UI instead.
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});

  // Stable per-key callbacks, memoized once so child effects don't refire
  // on every parent render.
  const statusSetters = useMemo(() => {
    const build = (key: string) => (hasData: boolean) =>
      setTableStatus((prev) =>
        prev[key] === hasData ? prev : { ...prev, [key]: hasData },
      );

    return {
      travelUserData: build("travel-userData"),
      travelHodPending: build("travel-hodPending"),
      travelHrPending: build("travel-hrPending"),
      travelDirectorPending: build("travel-directorPending"),
      itUserData: build("it-userData"),
      itHodPending: build("it-hodPending"),
      itPending: build("it-itPending"),
      itAll: build("it-itAll"),
    };
  }, []);

  const visibleTableKeys = useMemo(() => {
    const keys = ["travel-userData", "it-userData"];
    if (isHod) keys.push("travel-hodPending", "it-hodPending");
    if (isHr) keys.push("travel-hrPending");
    if (isDirector) keys.push("travel-directorPending");
    if (isITAdmin) keys.push("it-itPending", "it-itAll");
    return keys;
  }, [isHod, isHr, isDirector, isITAdmin]);

  const allTablesReported = visibleTableKeys.every((key) => key in tableStatus);
  const hasAnyData = visibleTableKeys.some((key) => tableStatus[key]);
  const showWelcome = allTablesReported && !hasAnyData;

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
        {/* ----------WELCOME STATE (shown when no tables have data)------------ */}
        {showWelcome && <DashboardWelcome />}

        {/* ----------DATA TABLES------------ */}

        {/* TRAVEL REQUISITIONS */}

        {/* User Travel Requisitions */}
        <TravelRequisitionsTable
          dataFlag="userData"
          userEmail={userEmail}
          onStatusChange={statusSetters.travelUserData}
        />

        {/* Travel Requisitions Pending HOD Approval */}
        {isHod && (
          <TravelRequisitionsTable
            dataFlag="hodPending"
            hodEmail={userEmail}
            onStatusChange={statusSetters.travelHodPending}
          />
        )}

        {/* Travel Requisitions Pending HR Approval */}
        {isHr && (
          <TravelRequisitionsTable
            dataFlag="hrPending"
            onStatusChange={statusSetters.travelHrPending}
          />
        )}

        {/* Travel Requisitions Pending Director Approval */}
        {isDirector && (
          <TravelRequisitionsTable
            dataFlag="directorPending"
            onStatusChange={statusSetters.travelDirectorPending}
          />
        )}

        {/* IT REQUISITIONS */}

        {/* User IT Requisitions */}
        <ITRequisitionsTable
          dataFlag="userData"
          userEmail={userEmail}
          onStatusChange={statusSetters.itUserData}
        />

        {/* IT Requisitions Pending HOD Approval */}
        {isHod && (
          <ITRequisitionsTable
            dataFlag="hodPending"
            hodEmail={userEmail}
            onStatusChange={statusSetters.itHodPending}
          />
        )}

        {/* IT Requisitions Pending IT Approval */}
        {isITAdmin && (
          <ITRequisitionsTable
            dataFlag="itPending"
            onStatusChange={statusSetters.itPending}
          />
        )}

        {/* All IT Requisitions */}
        {isITAdmin && (
          <ITRequisitionsTable
            dataFlag="itAll"
            onStatusChange={statusSetters.itAll}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
