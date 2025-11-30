// app/employee/_components/clock-in-button.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { clockIn } from "../_actions/clock-actions";
import { getSelectedWorkTypeId } from "./work-type-selector";

type WorkType = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
};

type ClockInButtonProps = {
  workTypes: WorkType[];
};

export function ClockInButton({ workTypes }: ClockInButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleClockIn() {
    setIsPending(true);

    // Get selected work type from global state, or use default
    let workTypeId = getSelectedWorkTypeId();

    if (!workTypeId) {
      const defaultWorkType = workTypes.find((wt) => wt.isDefault) || workTypes[0];
      workTypeId = defaultWorkType?.id || "";
    }

    await clockIn(workTypeId || undefined);

    setIsPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClockIn}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-l from-violet-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-700/40 transition hover:brightness-110 hover:shadow-xl disabled:opacity-70"
    >
      {isPending && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {isPending ? "נכנס למשמרת..." : "כניסה למשמרת"}
    </button>
  );
}
