// app/employee/leave/_components/leave-request-form.tsx
"use client";

import * as React from "react";
import { CalendarDays, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createLeaveRequest } from "../../_actions/leave-actions";

export function LeaveRequestForm() {
  const [isPending, setIsPending] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const formRef = React.useRef<HTMLFormElement>(null);

  // Calculate days between dates
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const calculatedDays = React.useMemo(() => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return null;

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Count all days except Saturday (6)
      if (dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }, [startDate, endDate]);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setMessage(null);
    setErrors({});

    const result = await createLeaveRequest(formData);

    setIsPending(false);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      formRef.current?.reset();
      setStartDate("");
      setEndDate("");
    } else {
      setMessage({ type: "error", text: result.message });
      if (result.errors) {
        setErrors(result.errors);
      }
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          בקשת חופשה חדשה
        </CardTitle>
        <CardDescription>
          מלא את הפרטים והגש בקשה לאישור המנהל
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">סוג חופשה</Label>
            <Select name="leaveType" required defaultValue="VACATION">
              <SelectTrigger id="leaveType">
                <SelectValue placeholder="בחר סוג חופשה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VACATION">חופשה</SelectItem>
                <SelectItem value="SICK">מחלה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">תאריך התחלה</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-right"
                dir="ltr"
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">תאריך סיום</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-right"
                dir="ltr"
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate[0]}</p>
              )}
            </div>
          </div>

          {/* Calculated Days */}
          {calculatedDays !== null && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">ימי עבודה:</span>{" "}
                <span className="font-medium">
                  {calculatedDays} {calculatedDays === 1 ? "יום" : "ימים"}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                * לא כולל שבתות
              </p>
            </div>
          )}

          {/* Employee Note */}
          <div className="space-y-2">
            <Label htmlFor="employeeNote">הערות (אופציונלי)</Label>
            <Textarea
              id="employeeNote"
              name="employeeNote"
              placeholder="סיבה או הערות נוספות..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שולח בקשה...
              </>
            ) : (
              <>
                <Send className="ml-2 h-4 w-4" />
                שלח בקשה
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
