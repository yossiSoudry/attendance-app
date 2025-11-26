// app/employee/history/_components/period-select.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodSelectProps {
  currentPeriod: string;
}

export function PeriodSelect({ currentPeriod }: PeriodSelectProps) {
  const router = useRouter();

  const handleChange = (value: string) => {
    router.push(`/employee/history?period=${value}`);
  };

  return (
    <Select defaultValue={currentPeriod} onValueChange={handleChange}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="month">החודש</SelectItem>
        <SelectItem value="week">השבוע</SelectItem>
      </SelectContent>
    </Select>
  );
}