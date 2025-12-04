// app/admin/employees/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import type { Employee } from "@/types/prisma";
import {
  EmployeesDataTable,
  type EmployeeTableRow,
} from "../_components/employees-data-table";
import { EmployeeFormDialog } from "../_components/employee-form-dialog";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireAdminSession();

  const [employees, workTypes] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<Employee[]>,
    prisma.workType.findMany({
      select: { id: true, name: true, isDefault: true, rateType: true, rateValue: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: EmployeeTableRow[] = employees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    nationalId: emp.nationalId,
    status: emp.status as EmployeeTableRow["status"],
    employmentType: emp.employmentType as EmployeeTableRow["employmentType"],
    baseHourlyRate: emp.baseHourlyRate,
    monthlyRate: emp.monthlyRate,
    workDaysPerWeek: emp.workDaysPerWeek,
    travelAllowanceType:
      emp.travelAllowanceType as EmployeeTableRow["travelAllowanceType"],
    travelAllowanceAmount: emp.travelAllowanceAmount,
    createdAt: emp.createdAt.toISOString(),
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex items-center justify-between rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div>
          <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
            ניהול עובדים
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            צפייה וניהול של כל העובדים במערכת
          </p>
        </div>
        <EmployeeFormDialog mode="create" />
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>עדיין אין עובדים במערכת.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              לחץ על &quot;עובד חדש&quot; כדי להוסיף עובד חדש.
            </p>
          </div>
        ) : (
          <EmployeesDataTable data={rows} workTypes={workTypes} />
        )}
      </section>
    </div>
  );
}
