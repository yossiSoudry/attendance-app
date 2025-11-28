// app/admin/page.tsx
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import type { Employee } from "@/types/prisma";
import { Briefcase, Clock, Users } from "lucide-react";
import Link from "next/link";
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
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          ממשק מנהל – עובדים
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          זהו מסך בסיסי המציג את רשימת העובדים. בהמשך נוסיף כאן דשבורד, פילטרים
          ופעולות עריכה מתקדמות.
        </p>

        {/* ניווט */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin" className="gap-2">
              <Users className="h-4 w-4" />
              עובדים
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/shifts" className="gap-2">
              <Clock className="h-4 w-4" />
              משמרות
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/work-types" className="gap-2">
              <Briefcase className="h-4 w-4" />
              סוגי עבודה
            </Link>
          </Button>
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
              בקרוב נבנה כאן מסך ליצירת עובד חדש וניהול עובדים.
            </p>
          </div>
        ) : (
          <EmployeesDataTable data={rows} workTypes={workTypes} />
        )}
      </section>
    </div>
  );
}
