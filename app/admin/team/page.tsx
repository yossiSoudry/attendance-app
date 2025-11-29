// app/admin/team/page.tsx
import { redirect } from "next/navigation";
import { Users, Mail } from "lucide-react";

import { requireAdminSession, canManageAdmins } from "@/lib/auth";
import { getAdmins, getPendingInvitations, getDepartments } from "./_actions/admin-actions";
import { AdminsTable } from "./_components/admins-table";
import { InviteAdminDialog } from "./_components/invite-admin-dialog";
import { PendingInvitations } from "./_components/pending-invitations";
import { Separator } from "@/components/ui/separator";

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
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            ניהול צוות
          </h1>
          <p className="text-muted-foreground mt-1">
            ניהול מנהלים והרשאות במערכת
          </p>
        </div>
        <InviteAdminDialog
          currentUserRole={session.user.role}
          departments={departments}
        />
      </div>

      {/* Admins Table */}
      <section className="space-y-4">
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

      <Separator />

      {/* Pending Invitations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="size-5" />
          הזמנות ממתינות ({invitations.length})
        </h2>
        <PendingInvitations invitations={invitations} />
      </section>
    </div>
  );
}
