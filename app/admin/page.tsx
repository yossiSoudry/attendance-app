// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import type { Employee } from "@/types/prisma";
import { getPendingShiftsCount } from "./_actions/approval-actions";
import {
  EmployeesDataTable,
  type EmployeeTableRow,
} from "./_components/employees-data-table";
import { PendingShiftsDialog } from "./_components/pending-shifts-dialog";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const employees: Employee[] = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

  const workTypes = await prisma.workType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const pendingCount = await getPendingShiftsCount();

  // TODO: החלף ב-ID מהסשן שלך
  const managerId = "00000000-0000-0000-0000-000000000001";

  const rows: EmployeeTableRow[] = employees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    nationalId: emp.nationalId,
    status: emp.status as EmployeeTableRow["status"],
    baseHourlyRate: emp.baseHourlyRate,
    createdAt: emp.createdAt.toISOString(),
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">ניהול עובדים</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              צפה וערוך את רשימת העובדים במערכת
            </p>
          </div>
          <PendingShiftsDialog
            managerId={managerId}
            initialCount={pendingCount}
            workTypes={workTypes}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>עדיין אין עובדים במערכת.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              לחץ על כפתור "הוסף עובד" כדי להוסיף עובד חדש.
            </p>
          </div>
        ) : (
          <EmployeesDataTable data={rows} workTypes={workTypes} />
        )}
      </section>
    </div>
  );
}
