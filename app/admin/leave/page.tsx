// app/admin/leave/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { getPendingLeaveRequests } from "./_actions/leave-admin-actions";
import { LeaveAdminContent } from "./_components/leave-admin-content";

export const dynamic = "force-dynamic";

export default async function AdminLeavePage() {
  await requireAdminSession();

  const [pendingRequests, employees] = await Promise.all([
    getPendingLeaveRequests(),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground">ניהול חופשות</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          אישור ודחייה של בקשות חופשה ומחלה
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <LeaveAdminContent
          initialPending={pendingRequests}
          employees={employees}
        />
      </section>
    </div>
  );
}
