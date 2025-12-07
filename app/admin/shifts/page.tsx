// app/admin/shifts/page.tsx
import { prisma } from "@/lib/prisma";
import {
  ShiftsDataTable,
  type ShiftTableRow,
} from "./_components/shifts-data-table";
import { ShiftFormDialog } from "./_components/shift-form-dialog";
import { ExportShiftsButton } from "./_components/export-shifts-button";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const shifts = await prisma.shift.findMany({
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
      workType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  const rows: ShiftTableRow[] = shifts.map((shift: typeof shifts[number]) => ({
    id: shift.id,
    employeeId: shift.employee.id,
    employeeName: shift.employee.fullName,
    workTypeId: shift.workType?.id ?? null,
    workTypeName: shift.workType?.name ?? null,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString() ?? null,
    status: shift.status,
    source: shift.source,
    isRetro: shift.isRetro,
    notesManager: shift.notesManager,
  }));

  // רשימת עובדים לפילטר
  const employees = await prisma.employee.findMany({
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const workTypes = await prisma.workType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const employeeOptions = employees.map((e: typeof employees[number]) => ({ label: e.fullName, value: e.id }));
  const workTypeOptions = workTypes.map((wt: typeof workTypes[number]) => ({ label: wt.name, value: wt.id }));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ניהול משמרות
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              צפייה בכל המשמרות, סינון לפי עובד, תאריך וסטטוס.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ShiftFormDialog
              mode="create"
              employees={employeeOptions}
              workTypes={workTypeOptions}
            />
            <ExportShiftsButton />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <ShiftsDataTable
          data={rows}
          employees={employeeOptions}
          workTypes={workTypeOptions}
          hideCreateButton
        />
      </section>
    </div>
  );
}
