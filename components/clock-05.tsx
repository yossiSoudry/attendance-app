"use client";

import * as React from "react";
import { Widget, WidgetContent } from "@/components/ui/widget";

export default function WidgetDemo() {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!time) {
    return (
      <Widget size="md">
        <WidgetContent />
      </Widget>
    );
  }

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hoursDegrees = ((hours + minutes / 60) / 12) * 360;
  const minutesDegrees = ((minutes + seconds / 60) / 60) * 360;
  const secondsDegrees = (seconds / 60) * 360;

  const day = time.toLocaleDateString("he-IL", { weekday: "long" });
  const month = time.toLocaleDateString("he-IL", { month: "long" });
  const date = time.getDate().toString().padStart(2, "0");

  return (
    <Widget size="md">
      <WidgetContent className="justify-around">
        {/* תאריך */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-medium text-destructive">{day}</span>
          </div>
          <span className="text-7xl font-bold text-gray-800 dark:text-gray-200">
            {date}
          </span>
          <span className="text-lg text-muted-foreground">{month}</span>
        </div>

        {/* מפריד */}
        <div className="h-24 w-px bg-border" />

        {/* שעון */}
        <div className="relative flex items-center justify-center">
          {[...Array(12)].map((_, i) => {
            const hour = i + 1;
            const angle = (hour / 12) * 360;
            const radians = (angle * Math.PI) / 180;
            const x = Math.sin(radians) * 55;
            const y = -Math.cos(radians) * 55;
            return (
              <div
                key={hour}
                className="absolute text-xs font-semibold text-gray-800 dark:text-gray-200"
                style={{
                  transform: `translate(${Math.round(x * 100) / 100}px, ${Math.round(y * 100) / 100}px)`,
                }}
              >
                {hour}
              </div>
            );
          })}
          <div className="relative size-[70px]">
            <div
              className="absolute bottom-1/2 left-1/2 h-5 w-1 origin-bottom rounded-full bg-gray-800 dark:bg-gray-200"
              style={{
                transform: `translateX(-50%) rotate(${hoursDegrees}deg)`,
              }}
            />
            <div
              className="absolute bottom-1/2 left-1/2 h-7 w-0.5 origin-bottom rounded-full bg-gray-600 dark:bg-gray-400"
              style={{
                transform: `translateX(-50%) rotate(${minutesDegrees}deg)`,
              }}
            />
            <div
              className="absolute bottom-1/2 left-1/2 h-8 w-0.5 origin-bottom rounded-full bg-red-500"
              style={{
                transform: `translateX(-50%) rotate(${secondsDegrees}deg)`,
              }}
            />
            <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-gray-200" />
          </div>
        </div>
      </WidgetContent>
    </Widget>
  );
}