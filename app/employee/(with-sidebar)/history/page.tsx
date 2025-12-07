// app/employee/(with-sidebar)/history/page.tsx
import { prisma } from "@/lib/prisma";
import { getPlatformTimezone } from "@/lib/timezone";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShiftHistoryList } from "../../_components/history/shift-history-list";
import { PeriodNavigator } from "../../_components/history/period-navigator";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ period?: string; offset?: string }>;
};

export default async function EmployeeHistoryPage({ searchParams }: PageProps) {
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

  const { period = "month", offset: offsetStr = "0" } = await searchParams;
  const offset = parseInt(offsetStr, 10) || 0;

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === "week") {
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() - offset * 7);

    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
  }

  const shifts = await prisma.shift.findMany({
    where: {
      employeeId: employee.id,
      startTime: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { startTime: "desc" },
  });

  const timezone = await getPlatformTimezone();

  const rows = shifts.map((shift: typeof shifts[number]) => ({
    id: shift.id,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString() ?? null,
    status: shift.status,
    isRetro: shift.isRetro,
  }));

  return (
    <div className="flex w-full flex-col gap-6 pb-2">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">היסטוריית משמרות</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {shifts.length} משמרות בתקופה זו
            </p>
          </div>
          <PeriodNavigator period={period} offset={offset} />
        </div>
      </section>

      <ShiftHistoryList shifts={rows} timezone={timezone} />
    </div>
  );
}