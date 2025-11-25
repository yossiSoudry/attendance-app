// app/employee/history/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShiftHistoryList } from "./_components/shift-history-list";

export const dynamic = "force-dynamic";

export default async function EmployeeHistoryPage() {
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

  const shifts = await prisma.shift.findMany({
    where: { employeeId: employee.id },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  const rows = shifts.map((shift) => ({
    id: shift.id,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString() ?? null,
    status: shift.status,
    isRetro: shift.isRetro,
  }));

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-foreground">
          היסטוריית משמרות
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          צפייה ב-50 המשמרות האחרונות שלך.
        </p>
      </section>

      <ShiftHistoryList shifts={rows} />
    </div>
  );
}