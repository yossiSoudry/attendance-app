// app/employee/page.tsx
import { ShiftDurationWidget } from "@/components/shift-duration-widget";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import type { ShiftStatus } from "@/types/prisma";
import { History } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClockInButton } from "./_components/clock-in-button";
import { ClockOutButton } from "./_components/clock-out-button";
import { RetroShiftFormDialog } from "./_components/retro-shift-form-dialog";
import { MyPendingShifts } from "./_components/my-pending-shifts";

export const dynamic = "force-dynamic";

export default async function EmployeeHomePage() {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
    redirect("/employee/login");
  }

  const openShift = await prisma.shift.findFirst({
    where: {
      employeeId: employee.id,
      status: "OPEN",
    },
    orderBy: { startTime: "desc" },
    include: {
      workType: {
        select: { name: true },
      },
    },
  });

  const lastClosedShift = await prisma.shift.findFirst({
    where: {
      employeeId: employee.id,
      status: "CLOSED",
    },
    orderBy: { endTime: "desc" },
  });

  // Fetch work types for clock-in selection
  const workTypes = await prisma.workType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  const inShift = Boolean(openShift);
  const startedAt =
    openShift?.startTime &&
    openShift.startTime.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });

  function formatLastShift(shift: { startTime: Date; endTime: Date }) {
    const now = new Date();
    const shiftDate = new Date(shift.startTime);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const shiftDay = new Date(
      shiftDate.getFullYear(),
      shiftDate.getMonth(),
      shiftDate.getDate()
    );

    const timeRange = `${shift.startTime.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    })} – ${shift.endTime.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    if (shiftDay.getTime() === today.getTime()) {
      return `היום, ${timeRange}`;
    }

    if (shiftDay.getTime() === yesterday.getTime()) {
      return `אתמול, ${timeRange}`;
    }

    if (shiftDay >= weekAgo) {
      const dayName = shiftDate.toLocaleDateString("he-IL", {
        weekday: "long",
      });
      const date = shiftDate.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "numeric",
      });
      return `${dayName} ${date}, ${timeRange}`;
    }

    const date = shiftDate.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    return `${date}, ${timeRange}`;
  }

  const lastShiftSummary =
    lastClosedShift && lastClosedShift.startTime && lastClosedShift.endTime
      ? formatLastShift({
          startTime: lastClosedShift.startTime,
          endTime: lastClosedShift.endTime,
        })
      : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* כרטיסיה עליונה - רוחב מלא */}
      <section className="rounded-3xl border-2 bg-card p-6 shadow-md dark:shadow-secondary/50">
        <p className="text-xs text-muted-foreground">שלום,</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          {employee.fullName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          כאן אתה יכול לדווח על כניסה ויציאה מהמשמרת, ולראות מידע עדכני על
          הסטטוס שלך.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${
                inShift ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                inShift ? "bg-emerald-400" : "bg-muted-foreground"
              }`}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {inShift
              ? startedAt
                ? `אתה כעת במשמרת, מאז ${startedAt}${
                    openShift?.workType ? ` (${openShift.workType.name})` : ""
                  }`
                : "אתה כעת במשמרת"
              : "אינך במשמרת כרגע"}
          </span>
        </div>
      </section>

      {/* גריד - ווידג'ט + כרטיסיית היסטוריה */}
      <div className="flex flex-col gap-6 sm:flex-row">
        <ShiftDurationWidget startTime={openShift?.startTime} inShift={inShift}>
          {inShift ? (
            <ClockOutButton />
          ) : (
            <ClockInButton workTypes={workTypes} />
          )}
        </ShiftDurationWidget>

        <section className="flex flex-1 flex-col justify-center rounded-3xl border-2 bg-card p-6 shadow-md dark:shadow-secondary/50">
          <div className="space-y-3 text-sm text-muted-foreground">
            {lastShiftSummary && (
              <p>
                <span className="font-medium text-foreground">
                  המשמרת האחרונה:
                </span>{" "}
                {lastShiftSummary}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/employee/history" className="gap-2">
                  <History className="h-4 w-4" />
                  היסטוריית משמרות
                </a>
              </Button>
              <RetroShiftFormDialog
                employeeId={employee.id}
                workTypes={workTypes}
              />
            </div>
          </div>
        </section>
      </div>

      {/* משמרות ממתינות */}
      <section className="rounded-3xl border-2 bg-card shadow-md dark:shadow-secondary/50">
        <MyPendingShifts employeeId={employee.id} />
      </section>
    </div>
  );
}