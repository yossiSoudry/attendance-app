// app/employee/(with-sidebar)/payroll/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PayrollContent } from "../../_components/payroll-content";

export const dynamic = "force-dynamic";

export default async function EmployeePayrollPage() {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
    redirect("/employee/login");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">חישוב שכר חודשי</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            פירוט שכר לפי חוק שעות עבודה ומנוחה
          </p>
        </div>
      </section>

      <PayrollContent employeeId={employee.id} />
    </div>
  );
}
