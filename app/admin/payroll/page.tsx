// app/admin/payroll/page.tsx
import { prisma } from "@/lib/prisma";
import { AdminPayrollContent } from "./_components/admin-payroll-content";

export const dynamic = "force-dynamic";

export default async function AdminPayrollPage() {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">חישוב שכר עובדים</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            פירוט שכר חודשי לפי עובד, כולל שעות נוספות ובונוסים
          </p>
        </div>
      </section>

      <AdminPayrollContent employees={employees} />
    </div>
  );
}
