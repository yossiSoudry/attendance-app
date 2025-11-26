// components/shift-duration-widget.tsx
"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Widget, WidgetContent, WidgetTitle } from "@/components/ui/widget";

interface ShiftDurationWidgetProps {
  startTime?: Date | null;
  action: () => void;
  inShift: boolean;
}

function SubmitButton({ inShift }: { inShift: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-l from-violet-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-700/40 transition hover:brightness-110 hover:shadow-xl disabled:opacity-70"
    >
      {pending && (
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
      {pending
        ? inShift
          ? "יוצא מהמשמרת..."
          : "נכנס למשמרת..."
        : inShift
          ? "יציאה מהמשמרת"
          : "כניסה למשמרת"}
    </button>
  );
}

export function ShiftDurationWidget({
  startTime,
  action,
  inShift,
}: ShiftDurationWidgetProps) {
  const [duration, setDuration] = React.useState(() =>
    startTime
      ? Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      : 0
  );

  React.useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      setDuration(
        Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  const formatTime = (num: number) => String(num).padStart(2, "0");

  return (
    <Widget size="md" className="h-full">
      <WidgetContent className="flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          {inShift ? "משך המשמרת" : "לא במשמרת"}
        </p>

        {inShift && (
          <WidgetTitle className="text-5xl tabular-nums tracking-widest">
            {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
          </WidgetTitle>
        )}

        <form action={action} className="w-full">
          <SubmitButton inShift={inShift} />
        </form>
      </WidgetContent>
    </Widget>
  );
}