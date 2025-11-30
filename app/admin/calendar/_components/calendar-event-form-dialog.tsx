// app/admin/calendar/_components/calendar-event-form-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "../_actions/calendar-actions";
import type { CalendarEventTableRow } from "./calendar-data-table";

// ========================================
// Types
// ========================================

type CalendarEventFormDialogProps =
  | {
      mode: "create";
      event?: never;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }
  | {
      mode: "edit";
      event: CalendarEventTableRow;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    };

// ========================================
// Component
// ========================================

export function CalendarEventFormDialog({
  mode,
  event,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CalendarEventFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  // Form state
  const [date, setDate] = React.useState<Date | undefined>(
    event ? new Date(event.gregorianDate) : undefined
  );
  const [nameHe, setNameHe] = React.useState(event?.nameHe ?? "");
  const [nameEn, setNameEn] = React.useState(event?.nameEn ?? "");
  const [eventType, setEventType] = React.useState<
    "HOLIDAY" | "FAST" | "ROSH_CHODESH" | "MEMORIAL" | "CUSTOM"
  >(event?.eventType ?? "HOLIDAY");
  const [isRestDay, setIsRestDay] = React.useState(event?.isRestDay ?? false);
  const [isShortDay, setIsShortDay] = React.useState(event?.isShortDay ?? false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  function resetForm() {
    if (mode === "create") {
      setDate(undefined);
      setNameHe("");
      setNameEn("");
      setEventType("HOLIDAY");
      setIsRestDay(false);
      setIsShortDay(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !nameHe.trim()) return;

    setIsPending(true);

    try {
      const payload = {
        gregorianDate: date,
        nameHe: nameHe.trim(),
        nameEn: nameEn.trim() || undefined,
        eventType: eventType as "HOLIDAY" | "FAST" | "ROSH_CHODESH" | "MEMORIAL" | "CUSTOM",
        isRestDay,
        isShortDay,
      };

      if (mode === "edit" && event) {
        await updateCalendarEvent({ id: event.id, ...payload });
      } else {
        await createCalendarEvent(payload);
      }

      onOpenChange?.(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setIsPending(false);
    }
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "הוספת אירוע חדש" : "עריכת אירוע"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "הוסף חג, צום או אירוע מותאם אישית ללוח השנה."
            : "ערוך את פרטי האירוע."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="date">תאריך</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-right font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: he }) : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={he}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Name Hebrew */}
        <div className="space-y-2">
          <Label htmlFor="nameHe">שם האירוע (עברית)</Label>
          <Input
            id="nameHe"
            value={nameHe}
            onChange={(e) => setNameHe(e.target.value)}
            placeholder="לדוגמה: פסח"
            required
          />
        </div>

        {/* Name English */}
        <div className="space-y-2">
          <Label htmlFor="nameEn">שם האירוע (אנגלית)</Label>
          <Input
            id="nameEn"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="לדוגמה: Passover"
          />
        </div>

        {/* Event Type */}
        <div className="space-y-2">
          <Label>סוג אירוע</Label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOLIDAY">חג</SelectItem>
              <SelectItem value="FAST">צום</SelectItem>
              <SelectItem value="ROSH_CHODESH">ראש חודש</SelectItem>
              <SelectItem value="MEMORIAL">יום זיכרון</SelectItem>
              <SelectItem value="CUSTOM">מותאם אישית</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rest Day Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="isRestDay">יום מנוחה</Label>
            <p className="text-xs text-muted-foreground">
              משפיע על חישוב שעות נוספות (150%)
            </p>
          </div>
          <Switch
            id="isRestDay"
            checked={isRestDay}
            onCheckedChange={setIsRestDay}
          />
        </div>

        {/* Short Day Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="isShortDay">יום קצר (ערב חג)</Label>
            <p className="text-xs text-muted-foreground">
              יום עבודה מקוצר - 7 שעות במקום 8
            </p>
          </div>
          <Switch
            id="isShortDay"
            checked={isShortDay}
            onCheckedChange={setIsShortDay}
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isPending || !date || !nameHe.trim()}>
            {isPending
              ? "שומר..."
              : mode === "create"
                ? "הוסף אירוע"
                : "שמור שינויים"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          אירוע חדש
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
