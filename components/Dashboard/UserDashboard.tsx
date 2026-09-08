"use client";

import { useUser } from "@/context/UserContext";
import TravelRequisitionsTable from "./TravelRequisitionsTable";
import ITRequisitionsTable from "./ITRequisitionsDashboard/ITRequisitionsTable";
import AccessRequisitionsTable from "./AccessRequisitionsDashboard/AccessRequisitionsTable";
import CasualRequisitionsTable from "./CasualRequisitionsDashboard/CasualRequisitionsTable";
import EmployeeRequisitionsTable from "./EmployeeRequisitionsDashboard/EmployeeRequisitionsTable";
import DashboardWatermark from "../Modules/DashboardWaterMark";
import DashboardWelcome from "./DashboardWelcome";
import { useEffect, useMemo, useState } from "react";
import DashboardAlert from "./DashboardAlert";
import DashboardTableNav from "./DashboardTableNav";
import { DASHBOARD_TABLES } from "@/lib/dashboardTables";

const UserDashboard = () => {
  const { username, email: userEmail, roles, memberships } = useUser();

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
  const isHr = roles.includes("hr-travel");
  const isDirector = roles.includes("director");

  // Array-based approval-stage membership (Security/IT/Director/Retail
  // Director/HR) — see serverActions/GetApproverMemberships.ts. Distinct
  // from `isDirector` above, which is Travel's role-based director gate.
  const isSecurityApprover = memberships.isSecurityApprover;
  const isCasualHrApprover = memberships.hrForms.includes("casual");
  const isRetailDirectorApprover = memberships.isRetailDirector;
  const isEmployeeDirectorApprover = memberships.isDirector;
  const isEmployeeHrApprover = memberships.hrForms.includes("employee");

  // --- TRACK WHETHER THE CURRENTLY RENDERED TABLES HAVE ANY DATA ---
  // Each table reports its own load state once fetched; once every table
  // relevant to this user's roles has reported and none has data, we know
  // the dashboard is empty and can show a welcoming UI instead.
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});

  // One stable callback per tableKey. The full set of possible keys is
  // static regardless of role/membership (only which ones get *rendered*
  // varies), so they can all be built once up front rather than lazily.
  const ALL_TABLE_KEYS = DASHBOARD_TABLES.map((table) => table.key);
  const statusSetters = useMemo(() => {
    const build = (key: string) => (hasData: boolean) =>
      setTableStatus((prev) =>
        prev[key] === hasData ? prev : { ...prev, [key]: hasData },
      );
    return Object.fromEntries(ALL_TABLE_KEYS.map((key) => [key, build(key)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleTableKeys = useMemo(() => {
    const keys = [
      "travel-userData",
      "it-userData",
      "access-userData",
      "casual-userData",
      "employee-userData",
    ];
    if (isHod)
      keys.push(
        "travel-hodPending",
        "it-hodPending",
        "access-hodPending",
        "casual-hodPending",
        "employee-hodPending",
      );
    if (isHr) keys.push("travel-hrPending");
    if (isDirector) keys.push("travel-directorPending");
    if (isITAdmin) keys.push("it-itPending", "it-itAll");
    if (isSecurityApprover) keys.push("access-securityPending");
    if (isCasualHrApprover) keys.push("casual-hrPending");
    if (isRetailDirectorApprover) keys.push("employee-retailDirectorPending");
    if (isEmployeeDirectorApprover) keys.push("employee-directorPending");
    if (isEmployeeHrApprover) keys.push("employee-hrPending");
    return keys;
  }, [
    isHod,
    isHr,
    isDirector,
    isITAdmin,
    isSecurityApprover,
    isCasualHrApprover,
    isRetailDirectorApprover,
    isEmployeeDirectorApprover,
    isEmployeeHrApprover,
  ]);

  const allTablesReported = visibleTableKeys.every((key) => key in tableStatus);
  const hasAnyData = visibleTableKeys.some((key) => tableStatus[key]);
  const showWelcome = allTablesReported && !hasAnyData;

  // Tables to list in the jump nav: role/membership-visible AND actually
  // rendering data (RequisitionTable returns null otherwise), kept in DOM
  // order via DASHBOARD_TABLES rather than visibleTableKeys' grouping order.
  const navItems = useMemo(
    () =>
      DASHBOARD_TABLES.filter(
        (table) =>
          visibleTableKeys.includes(table.key) && tableStatus[table.key],
      ),
    [visibleTableKeys, tableStatus],
  );

  return (
    <div className="relative h-full p-2">
      {/* The dashboard alert */}
      <DashboardAlert />
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 flex -translate-x-1/2 items-center justify-center overflow-hidden lg:left-[calc(80px+(100vw-80px)/2)]">
        {/* ---------- WATERMARK LAYER ---------- */}
        <DashboardWatermark />
      </div>

      {/* 3. THE CONTENT LAYER */}

      <div className="relative z-10 space-y-4">
        {/* ----------JUMP NAV (shown once enough tables render)------------ */}
        <DashboardTableNav items={navItems} />

        {/* ----------WELCOME STATE (shown when no tables have data)------------ */}
        {showWelcome && <DashboardWelcome />}

        {/* ----------DATA TABLES------------ */}

        {/* TRAVEL REQUISITIONS */}

        {/* User Travel Requisitions */}
        <TravelRequisitionsTable
          dataFlag="userData"
          onStatusChange={statusSetters["travel-userData"]}
        />

        {/* Travel Requisitions Pending HOD Approval */}
        {isHod && (
          <TravelRequisitionsTable
            dataFlag="hodPending"
            onStatusChange={statusSetters["travel-hodPending"]}
          />
        )}

        {/* Travel Requisitions Pending HR Approval */}
        {isHr && (
          <TravelRequisitionsTable
            dataFlag="hrPending"
            onStatusChange={statusSetters["travel-hrPending"]}
          />
        )}

        {/* Travel Requisitions Pending Director Approval */}
        {isDirector && (
          <TravelRequisitionsTable
            dataFlag="directorPending"
            onStatusChange={statusSetters["travel-directorPending"]}
          />
        )}

        {/* IT REQUISITIONS */}

        {/* User IT Requisitions */}
        <ITRequisitionsTable
          dataFlag="userData"
          onStatusChange={statusSetters["it-userData"]}
        />

        {/* IT Requisitions Pending HOD Approval */}
        {isHod && (
          <ITRequisitionsTable
            dataFlag="hodPending"
            onStatusChange={statusSetters["it-hodPending"]}
          />
        )}

        {/* IT Requisitions Pending IT Approval */}
        {isITAdmin && (
          <ITRequisitionsTable
            dataFlag="itPending"
            onStatusChange={statusSetters["it-itPending"]}
          />
        )}

        {/* All IT Requisitions */}
        {isITAdmin && (
          <ITRequisitionsTable
            dataFlag="itAll"
            onStatusChange={statusSetters["it-itAll"]}
          />
        )}

        {/* KEY & ACCESS REQUISITIONS */}

        {/* User Access Requisitions */}
        <AccessRequisitionsTable
          dataFlag="userData"
          onStatusChange={statusSetters["access-userData"]}
        />

        {/* Access Requisitions Pending HOD Approval */}
        {isHod && (
          <AccessRequisitionsTable
            dataFlag="hodPending"
            onStatusChange={statusSetters["access-hodPending"]}
          />
        )}

        {/* Access Requisitions Pending Security Approval */}
        {isSecurityApprover && (
          <AccessRequisitionsTable
            dataFlag="securityPending"
            onStatusChange={statusSetters["access-securityPending"]}
          />
        )}

        {/* CASUAL REQUISITIONS */}

        {/* User Casual Requisitions */}
        <CasualRequisitionsTable
          dataFlag="userData"
          onStatusChange={statusSetters["casual-userData"]}
        />

        {/* Casual Requisitions Pending HOD Approval */}
        {isHod && (
          <CasualRequisitionsTable
            dataFlag="hodPending"
            onStatusChange={statusSetters["casual-hodPending"]}
          />
        )}

        {/* Casual Requisitions Pending HR Approval */}
        {isCasualHrApprover && (
          <CasualRequisitionsTable
            dataFlag="hrPending"
            onStatusChange={statusSetters["casual-hrPending"]}
          />
        )}

        {/* EMPLOYEE REQUISITIONS */}

        {/* User Employee Requisitions */}
        <EmployeeRequisitionsTable
          dataFlag="userData"
          onStatusChange={statusSetters["employee-userData"]}
        />

        {/* Employee Requisitions Pending HOD Approval */}
        {isHod && (
          <EmployeeRequisitionsTable
            dataFlag="hodPending"
            onStatusChange={statusSetters["employee-hodPending"]}
          />
        )}

        {/* Employee Requisitions Pending Retail Director Approval */}
        {isRetailDirectorApprover && (
          <EmployeeRequisitionsTable
            dataFlag="retailDirectorPending"
            onStatusChange={statusSetters["employee-retailDirectorPending"]}
          />
        )}

        {/* Employee Requisitions Pending CEO Approval */}
        {isEmployeeDirectorApprover && (
          <EmployeeRequisitionsTable
            dataFlag="directorPending"
            onStatusChange={statusSetters["employee-directorPending"]}
          />
        )}

        {/* Employee Requisitions Pending HR Approval */}
        {isEmployeeHrApprover && (
          <EmployeeRequisitionsTable
            dataFlag="hrPending"
            onStatusChange={statusSetters["employee-hrPending"]}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
