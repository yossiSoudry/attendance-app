// app/admin/shifts/_components/export-shifts-button.tsx
"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { exportShiftsToExcel } from "../_actions/export-shifts";

export function ExportShiftsButton() {
  const [isPending, setIsPending] = React.useState(false);

  async function handleExport(type: "summary" | "detailed") {
    setIsPending(true);

    const result = await exportShiftsToExcel(type);

    if (result.success && result.data && result.filename) {
      // המרת base64 לקובץ והורדה
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setIsPending(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8" variant="outline" disabled={isPending}>
          {isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="ml-2 h-4 w-4" />
          )}
          ייצוא Excel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("summary")}>
          דוח סיכום (לפי עובד)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("detailed")}>
          דוח מפורט (כל המשמרות)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}