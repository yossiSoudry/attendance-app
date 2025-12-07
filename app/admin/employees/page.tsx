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
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ניהול עובדים
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              צפייה וניהול של כל העובדים במערכת
            </p>
          </div>
          <EmployeeFormDialog mode="create" />
        </div>
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
          <EmployeesDataTable data={rows} workTypes={workTypes} hideCreateButton />
        )}
      </section>
    </div>
  );
}
