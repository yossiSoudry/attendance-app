// app/employee/leave/_components/leave-request-form.tsx
"use client";

import * as React from "react";
import { CalendarDays, Loader2, Send, FileUp, X, FileText } from "lucide-react";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";

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

type UploadedDocument = {
  url: string;
  name: string;
  publicId: string;
};

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
  const [leaveType, setLeaveType] = React.useState<"VACATION" | "SICK">("VACATION");
  const [uploadedDoc, setUploadedDoc] = React.useState<UploadedDocument | null>(null);

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

  function handleUploadSuccess(result: CloudinaryUploadWidgetResults) {
    if (result.info && typeof result.info !== "string") {
      const info = result.info as {
        secure_url: string;
        original_filename: string;
        format: string;
        public_id: string;
      };
      setUploadedDoc({
        url: info.secure_url,
        name: `${info.original_filename}.${info.format}`,
        publicId: info.public_id,
      });
    }
  }

  function removeDocument() {
    setUploadedDoc(null);
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setMessage(null);
    setErrors({});

    // Validate sick leave requires document
    if (leaveType === "SICK" && !uploadedDoc) {
      setIsPending(false);
      setMessage({ type: "error", text: "יש להעלות אישור מחלה" });
      setErrors({ documentUrl: ["יש להעלות אישור מחלה"] });
      return;
    }

    // Add document info to form data if uploaded
    if (uploadedDoc) {
      formData.set("documentUrl", uploadedDoc.url);
      formData.set("documentName", uploadedDoc.name);
    }

    const result = await createLeaveRequest(formData);

    setIsPending(false);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      formRef.current?.reset();
      setStartDate("");
      setEndDate("");
      setLeaveType("VACATION");
      setUploadedDoc(null);
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
            <Select
              name="leaveType"
              required
              value={leaveType}
              onValueChange={(v) => setLeaveType(v as "VACATION" | "SICK")}
            >
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

          {/* Sick Leave Document Upload - Required */}
          {leaveType === "SICK" && (
            <div className="space-y-2">
              <Label>
                אישור מחלה <span className="text-destructive">*</span>
              </Label>
              {uploadedDoc ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">{uploadedDoc.name}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeDocument}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CldUploadWidget
                  signatureEndpoint="/api/sign-cloudinary-params"
                  options={{
                    folder: "attendance-app/sick-leave-docs",
                    resourceType: "auto",
                    maxFiles: 1,
                    clientAllowedFormats: [
                      "jpg",
                      "jpeg",
                      "png",
                      "pdf",
                      "heic",
                    ],
                    maxFileSize: 10000000, // 10MB
                    sources: ["local", "camera"],
                    language: "he",
                    text: {
                      he: {
                        or: "או",
                        menu: {
                          files: "מהמחשב",
                          camera: "מצלמה",
                        },
                        local: {
                          browse: "בחר קובץ",
                          dd_title_single: "גרור קובץ לכאן",
                          dd_title_multi: "גרור קבצים לכאן",
                        },
                      },
                    },
                  }}
                  onSuccess={handleUploadSuccess}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted ${
                        errors.documentUrl
                          ? "border-destructive bg-destructive/5"
                          : "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50"
                      }`}
                    >
                      <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        לחץ להעלאת אישור מחלה
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        תמונה או PDF (עד 10MB)
                      </span>
                    </button>
                  )}
                </CldUploadWidget>
              )}
              {errors.documentUrl && (
                <p className="text-xs text-destructive">{errors.documentUrl[0]}</p>
              )}
            </div>
          )}

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
