"use client";

import { useQuery } from "@tanstack/react-query";
import { GetSalaryAdvanceLock } from "@/serverActions/GetSalaryAdvanceLock";
import SalaryAdvanceClient from "./SalaryAdvanceClient";
import { Loader2, Lock } from "lucide-react";

export default function SalaryAdvancePage() {
  let isLocked = false;

  const { data: lockAdvanceForm = false, isPending: loading } = useQuery({
    queryKey: ["LockAdvanceBoolean"],
    queryFn: GetSalaryAdvanceLock,
    staleTime: 0,
    gcTime: 0,
  });

  // Time check logic (EAT timezone assumed based on your server config, but Date() uses system local time)
  const now = new Date();
  const currentDay = now.getDate();
  const currentHour = now.getHours();

  // Beyond 5.00pm (17:00) on the 10th of the month
  const isPastDeadline =
    currentDay > 10 || (currentDay === 10 && currentHour >= 17);

  if (isPastDeadline && lockAdvanceForm) {
    isLocked = true;
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-neutral-800">
        <Loader2 size={32} className="animate-spin" />

        <h1 className="mb-2 text-xl font-semibold text-slate-800">
          Loading...
        </h1>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Lock size={32} />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-slate-800">
          Requests Closed
        </h1>
        <p className="max-w-md text-slate-600">
          Salary advance requests are currently closed. All requests must be
          submitted no later than 5:00 PM on the 10th of every month.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SalaryAdvanceClient />
    </div>
  );
}
