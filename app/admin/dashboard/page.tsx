// app/admin/dashboard/page.tsx
import { requireAdminSession } from "@/lib/auth";
import {
  getDashboardStats,
  getRecentActivity,
  getTopEmployees,
} from "../_actions/dashboard-actions";
import { DashboardStatsCards } from "../_components/dashboard-stats";
import {
  RecentActivityList,
  TopEmployeesList,
} from "../_components/dashboard-activity";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAdminSession();

  const [dashboardStats, recentActivity, topEmployees] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(10),
    getTopEmployees(5),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            דשבורד
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            סקירה כללית של העסק
          </p>
        </div>
      </section>

      {/* Dashboard Stats */}
      <DashboardStatsCards stats={dashboardStats} />

      {/* Activity and Top Employees */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityList activities={recentActivity} />
        <TopEmployeesList employees={topEmployees} />
      </div>
    </div>
  );
}
