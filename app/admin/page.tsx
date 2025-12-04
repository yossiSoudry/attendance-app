// app/admin/page.tsx
import { requireAdminSession } from "@/lib/auth";
import { AdminHeader } from "./_components/admin-header";
import { DashboardStatsCards } from "./_components/dashboard-stats";
import { RecentActivityList, TopEmployeesList } from "./_components/dashboard-activity";
import {
  getDashboardStats,
  getRecentActivity,
  getTopEmployees,
} from "./_actions/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  const [stats, recentActivity, topEmployees] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(8),
    getTopEmployees(5),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <AdminHeader session={session} />

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          לוח בקרה
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          סקירה כללית של פעילות הארגון
        </p>
      </section>

      <DashboardStatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivityList activities={recentActivity} />
        <TopEmployeesList employees={topEmployees} />
      </div>
    </div>
  );
}
