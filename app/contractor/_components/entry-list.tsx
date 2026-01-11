// app/contractor/_components/entry-list.tsx
"use client";

import { Trash2, Pencil, FileX, AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatMinutesToDisplay } from "@/lib/validations/casual-worker-entry";
import {
  deleteCasualWorkerEntry,
  type CasualWorkerEntryWithId,
} from "../_actions/contractor-actions";
import { EntryFormDialog } from "./entry-form-dialog";

type EntryListProps = {
  entries: CasualWorkerEntryWithId[];
  workerNameSuggestions: string[];
};

function formatTime(date: Date): string {
  // Use UTC hours/minutes to avoid timezone conversion
  const d = new Date(date);
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function EntryList({ entries, workerNameSuggestions }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteCasualWorkerEntry(id);
    setDeletingId(null);
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileX className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">אין רשומות להצגה</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">
          רשומות שעות ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="text-right">יום</TableHead>
                <TableHead className="text-right">שם עובד</TableHead>
                <TableHead className="text-right">התחלה</TableHead>
                <TableHead className="text-right">סיום</TableHead>
                <TableHead className="text-right">משך</TableHead>
                <TableHead className="text-right w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const workDate = new Date(entry.workDate);
                // Use UTC to avoid timezone shifting the date
                const dayOfWeek = hebrewDays[workDate.getUTCDay()];
                const isLongShift = entry.durationMinutes > 12 * 60;

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {/* Format date using UTC values to avoid timezone shift */}
                      {`${workDate.getUTCDate().toString().padStart(2, "0")}/${(workDate.getUTCMonth() + 1).toString().padStart(2, "0")}/${workDate.getUTCFullYear()}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dayOfWeek}
                    </TableCell>
                    <TableCell>{entry.workerName}</TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-sm">
                      {formatTime(entry.startTime)}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-sm">
                      {formatTime(entry.endTime)}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-sm">
                      <span className="flex items-center justify-end gap-1.5">
                        {formatMinutesToDisplay(entry.durationMinutes)}
                        {isLongShift && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>משמרת ארוכה (מעל 12 שעות)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EntryFormDialog
                          mode="edit"
                          entry={entry}
                          workerNameSuggestions={workerNameSuggestions}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deletingId === entry.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת רשומה</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם למחוק את הרשומה של {entry.workerName} מתאריך{" "}
                                {`${workDate.getUTCDate().toString().padStart(2, "0")}/${(workDate.getUTCMonth() + 1).toString().padStart(2, "0")}/${workDate.getUTCFullYear()}`}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(entry.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
