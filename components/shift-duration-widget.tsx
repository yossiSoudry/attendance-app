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
  const [duration, setDuration] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);

    if (!startTime) return;

    // Calculate initial duration on client
    setDuration(
      Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
    );

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
            {isClient
              ? `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`
              : "00:00:00"}
          </WidgetTitle>
        )}

        <div className="w-full">
          {children}
        </div>
      </WidgetContent>
    </Widget>
  );
}