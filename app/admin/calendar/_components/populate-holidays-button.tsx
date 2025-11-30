// app/admin/calendar/_components/populate-holidays-button.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { populateHebrewHolidays } from "../_actions/calendar-actions";
import { toast } from "sonner";

// ========================================
// Types
// ========================================

type PopulateHolidaysButtonProps = {
  year: number;
};

// ========================================
// Component
// ========================================

export function PopulateHolidaysButton({ year }: PopulateHolidaysButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handlePopulate() {
    setIsPending(true);
    try {
      const result = await populateHebrewHolidays(year);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to populate holidays:", error);
      toast.error("אירעה שגיאה בטעינת החגים");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handlePopulate}
            disabled={isPending}
          >
            <Sparkles className="ml-2 h-4 w-4" />
            {isPending ? "טוען..." : `טען חגים ${year}`}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>מוסיף את כל החגים העבריים לשנת {year}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
