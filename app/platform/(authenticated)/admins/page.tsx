// app/platform/(authenticated)/admins/page.tsx
import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePlatformAdminSession } from "@/lib/platform-auth";

import { getPlatformAdmins } from "../../_actions/platform-admin-actions";
import { PlatformAdminsTable } from "../../_components/platform-admins-table";
import { AddPlatformAdminDialog } from "../../_components/add-platform-admin-dialog";

// Force dynamic rendering - this page fetches from database
export const dynamic = "force-dynamic";

export default async function PlatformAdminsPage() {
  const session = await requirePlatformAdminSession();
  const admins = await getPlatformAdmins();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מנהלי פלטפורמה</h1>
          <p className="text-muted-foreground">
            ניהול המנהלים שיכולים לגשת לממשק הפלטפורמה
          </p>
        </div>
        <AddPlatformAdminDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>כל המנהלים ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length > 0 ? (
            <PlatformAdminsTable admins={admins} currentAdminId={session.id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">אין מנהלים</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                צור מנהל פלטפורמה ראשון
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
