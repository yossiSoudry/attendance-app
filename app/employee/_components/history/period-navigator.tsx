// app/employee/history/_components/period-navigator.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PeriodNavigatorProps {
  period: string;
  offset: number;
}

function getMonthLabel(offset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - offset);
  return date.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
}

function getWeekLabel(offset: number): string {
  if (offset === 0) return "השבוע";
  if (offset === 1) return "שבוע שעבר";
  return `לפני ${offset} שבועות`;
}

export function PeriodNavigator({ period, offset }: PeriodNavigatorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isCurrentPeriod = offset === 0;

  const navigate = (newPeriod: string, newOffset: number) => {
    startTransition(() => {
      router.push(`/employee/history?period=${newPeriod}&offset=${newOffset}`);
    });
  };

  const handlePeriodChange = (value: string) => {
    navigate(value, 0);
  };

  const handlePrev = () => {
    navigate(period, offset + 1);
  };

  const handleNext = () => {
    if (offset > 0) {
      navigate(period, offset - 1);
    }
  };

  const displayLabel =
    period === "week" ? getWeekLabel(offset) : getMonthLabel(offset);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        disabled={isPending}
        className="h-9 w-9"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <Select
        value={period}
        onValueChange={handlePeriodChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-40 text-center">
          <SelectValue>{displayLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">חודש</SelectItem>
          <SelectItem value="week">שבוע</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={isCurrentPeriod || isPending}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}