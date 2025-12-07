// app/admin/team/page.tsx
import { redirect } from "next/navigation";
import { Users, Mail } from "lucide-react";

import { requireAdminSession, canManageAdmins } from "@/lib/auth";
import { getAdmins, getPendingInvitations, getDepartments } from "./_actions/admin-actions";
import { AdminsTable } from "./_components/admins-table";
import { InviteAdminDialog } from "./_components/invite-admin-dialog";
import { PendingInvitations } from "./_components/pending-invitations";

export default async function TeamPage() {
  const session = await requireAdminSession();

  // Only OWNER and ADMIN can view this page
  if (!canManageAdmins(session.user.role)) {
    redirect("/admin");
  }

  const [admins, invitations, departments] = await Promise.all([
    getAdmins(),
    getPendingInvitations(),
    getDepartments(),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ניהול צוות
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ניהול מנהלים והרשאות במערכת
            </p>
          </div>
          <InviteAdminDialog
            currentUserRole={session.user.role}
            departments={departments}
          />
        </div>
      </section>

      {/* Admins Table */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="size-5" />
          מנהלים ({admins.length})
        </h2>
        <AdminsTable
          admins={admins}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
        />
      </section>

      {/* Pending Invitations */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="size-5" />
          הזמנות ממתינות ({invitations.length})
        </h2>
        <PendingInvitations invitations={invitations} />
      </section>
    </div>
  );
}
