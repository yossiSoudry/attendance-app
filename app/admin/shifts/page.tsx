// app/admin/shifts/page.tsx
import { prisma } from "@/lib/prisma";
import { ShiftsDataTable, type ShiftTableRow } from "./_components/shifts-data-table";

export const dynamic = 'force-dynamic';

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

  const rows: ShiftTableRow[] = shifts.map((shift) => ({
    id: shift.id,
    employeeId: shift.employee.id,
    employeeName: shift.employee.fullName,
    workTypeName: shift.workType?.name ?? null,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString() ?? null,
    status: shift.status,
    source: shift.source,
    isRetro: shift.isRetro,
  }));

  // רשימת עובדים לפילטר
  const employees = await prisma.employee.findMany({
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          ניהול משמרות
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          צפייה בכל המשמרות, סינון לפי עובד, תאריך וסטטוס.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <ShiftsDataTable
          data={rows}
          employees={employees.map((e) => ({ label: e.fullName, value: e.id }))}
        />
      </section>
    </div>
  );
}