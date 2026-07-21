import { query } from "@/lib/db";
import SalaryAdvanceClient from "./SalaryAdvanceClient";
import { Lock } from "lucide-react";

export default async function SalaryAdvancePage() {
  let isLocked = false;

  try {
    const result = await query(
      "SELECT lock_advance_form FROM salary_advance_metadata ORDER BY id LIMIT 1",
    );
    const lockAdvanceForm = result[0]?.lock_advance_form || false;

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
  } catch (error) {
    console.error("Failed to check salary advance lock status", error);
  }

  if (isLocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Lock size={32} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
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
