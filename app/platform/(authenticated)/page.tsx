// app/platform/(authenticated)/page.tsx
import { Building2, Users, UserCog, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getPlatformStats, getOrganizations } from "../_actions/organization-actions";
import { OrganizationsTable } from "../_components/organizations-table";

// Force dynamic rendering - this page fetches from database
export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const [stats, organizations] = await Promise.all([
    getPlatformStats(),
    getOrganizations(),
  ]);

  // Recent organizations (last 5)
  const recentOrganizations = organizations.slice(0, 5);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">דשבורד פלטפורמה</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              סקירה כללית של כל הארגונים במערכת
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ ארגונים</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOrganizations} פעילים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ עובדים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              בכל הארגונים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ מנהלים</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              בכל הארגונים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שיעור פעילות</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrganizations > 0
                ? Math.round(
                    (stats.activeOrganizations / stats.totalOrganizations) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              ארגונים פעילים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Organizations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ארגונים אחרונים</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/organizations">
              צפה בכל הארגונים
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrganizations.length > 0 ? (
            <OrganizationsTable organizations={recentOrganizations} />
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
