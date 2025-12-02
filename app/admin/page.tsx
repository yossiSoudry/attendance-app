// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import type { Employee } from "@/types/prisma";
import { getPendingShiftsCount } from "./_actions/approval-actions";
import {
  EmployeesDataTable,
  type EmployeeTableRow,
} from "./_components/employees-data-table";
import { PendingShiftsDialog } from "./_components/pending-shifts-dialog";
import { AdminHeader } from "./_components/admin-header";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdminSession();

  const [employees, workTypes, pendingCount] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<Employee[]>,
    prisma.workType.findMany({
      select: { id: true, name: true, isDefault: true, rateType: true, rateValue: true },
      orderBy: { name: "asc" },
    }),
    getPendingShiftsCount(),
  ]);

  const managerId = session.user.id;

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
      {/* Header with user info */}
      <AdminHeader session={session} />

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
              ממשק מנהל – עובדים
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ניהול עובדים, משמרות וסוגי עבודה
            </p>
          </div>
          <PendingShiftsDialog
            managerId={managerId}
            initialCount={pendingCount}
            workTypes={workTypes}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>עדיין אין עובדים במערכת.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              לחץ על &quot;הוסף עובד&quot; כדי להוסיף עובד חדש.
            </p>
          </div>
        ) : (
          <EmployeesDataTable data={rows} workTypes={workTypes} />
        )}
      </section>
    </div>
  );
}
