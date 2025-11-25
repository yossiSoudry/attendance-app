// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import type { Employee } from "@prisma/client";
import {
  EmployeesDataTable,
  type EmployeeTableRow,
} from "./_components/employees-data-table";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const employees: Employee[] = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

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
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          ממשק מנהל – עובדים
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          זהו מסך בסיסי המציג את רשימת העובדים. בהמשך נוסיף כאן דשבורד, פילטרים
          ופעולות עריכה מתקדמות.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>עדיין אין עובדים במערכת.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              בקרוב נבנה כאן מסך ליצירת עובד חדש וניהול עובדים.
            </p>
          </div>
        ) : (
          <EmployeesDataTable data={rows} />
        )}
      </section>
    </div>
  );
}
