// app/employee/(with-sidebar)/page.tsx
import { ShiftDurationWidget } from "@/components/shift-duration-widget";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClockInButton } from "../_components/clock-in-button";
import { ClockOutButton } from "../_components/clock-out-button";
import { MyPendingShifts } from "../_components/my-pending-shifts";
import { RetroShiftFormDialog } from "../_components/retro-shift-form-dialog";
import { WorkTypeSelector } from "../_components/work-type-selector";

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
  // Only show: 1. Default work types (available to all), 2. Work types assigned to this employee
  const workTypes = await prisma.workType.findMany({
    where: {
      OR: [
        { isDefault: true },
        { employeeRates: { some: { employeeId: employee.id } } },
      ],
    },
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
    <div className="flex w-full flex-col gap-6">
      {/* Status Card */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
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
          <span className="text-sm text-muted-foreground">
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

      {/* Widget + Actions */}
      <div className="flex flex-col gap-6 sm:flex-row">
        <ShiftDurationWidget startTime={openShift?.startTime} inShift={inShift}>
          {inShift ? (
            <ClockOutButton />
          ) : (
            <ClockInButton workTypes={workTypes} />
          )}
        </ShiftDurationWidget>

        <section className="flex flex-1 flex-col justify-center rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            {/* Work type selector - only when not in shift */}
            {!inShift && <WorkTypeSelector workTypes={workTypes} />}

            {/* Last shift summary */}
            {lastShiftSummary && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  המשמרת האחרונה:
                </span>{" "}
                {lastShiftSummary}
              </p>
            )}

            {/* Retro shift button */}
            <div className="flex flex-wrap gap-2">
              <RetroShiftFormDialog
                employeeId={employee.id}
                workTypes={workTypes}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Pending Shifts */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <MyPendingShifts employeeId={employee.id} />
      </section>
    </div>
  );
}
