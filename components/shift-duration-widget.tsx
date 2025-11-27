// components/shift-duration-widget.tsx
"use client";

import * as React from "react";
import { Widget, WidgetContent, WidgetTitle } from "@/components/ui/widget";

interface ShiftDurationWidgetProps {
  startTime?: Date | null;
  inShift: boolean;
  children: React.ReactNode;
}

export function ShiftDurationWidget({
  startTime,
  inShift,
  children,
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

        <div className="w-full">
          {children}
        </div>
      </WidgetContent>
    </Widget>
  );
}