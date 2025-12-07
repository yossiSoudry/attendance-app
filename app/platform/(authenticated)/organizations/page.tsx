// app/platform/(authenticated)/organizations/page.tsx
import { Building2 } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getOrganizations } from "../../_actions/organization-actions";
import { OrganizationsTable } from "../../_components/organizations-table";

// Force dynamic rendering - this page fetches from database
export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ארגונים</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ניהול כל הארגונים במערכת
            </p>
          </div>
          <Button asChild>
            <Link href="/platform/organizations/new">
              <Building2 className="ml-2 h-4 w-4" />
              ארגון חדש
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>כל הארגונים ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 ? (
            <OrganizationsTable organizations={organizations} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">אין ארגונים עדיין</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                צור את הארגון הראשון כדי להתחיל
              </p>
              <Button className="mt-4" asChild>
                <Link href="/platform/organizations/new">
                  <Building2 className="ml-2 h-4 w-4" />
                  צור ארגון
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
