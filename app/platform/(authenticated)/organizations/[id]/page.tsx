// app/platform/(authenticated)/organizations/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Edit,
  Mail,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getOrganization } from "../../../_actions/organization-actions";
import { DeleteOrganizationButton } from "../../../_components/delete-organization-button";
import { EditOrganizationDialog } from "../../../_components/edit-organization-dialog";

const statusLabels: Record<string, string> = {
  ACTIVE: "פעיל",
  SUSPENDED: "מושעה",
  TRIAL: "ניסיון",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  SUSPENDED: "destructive",
  TRIAL: "secondary",
};

const planLabels: Record<string, string> = {
  FREE: "חינם",
  BASIC: "בסיסי",
  PREMIUM: "פרימיום",
  ENTERPRISE: "ארגוני",
};

const roleLabels: Record<string, string> = {
  OWNER: "בעלים",
  ADMIN: "מנהל",
  MANAGER: "מנהל מחלקה",
};

interface OrganizationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { id } = await params;
  const organization = await getOrganization(id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/platform/organizations">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {organization.name}
              </h1>
              <Badge variant={statusVariants[organization.status]}>
                {statusLabels[organization.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{organization.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditOrganizationDialog organization={organization} />
          <DeleteOrganizationButton
            id={organization.id}
            name={organization.name}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עובדים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization._count.employees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מנהלים</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization._count.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מחלקות</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization._count.departments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משמרות</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization._count.shifts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>פרטי הארגון</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">שם משפטי</p>
                <p className="font-medium">{organization.legalName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ח.פ.</p>
                <p className="font-medium">{organization.taxId || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">תוכנית</p>
                <Badge variant="outline">{planLabels[organization.plan]}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">תאריך יצירה</p>
                <p className="font-medium">
                  {new Date(organization.createdAt).toLocaleDateString("he-IL")}
                </p>
              </div>
              {organization.trialEndsAt && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">סיום תקופת ניסיון</p>
                  <p className="font-medium">
                    {new Date(organization.trialEndsAt).toLocaleDateString("he-IL")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card>
          <CardHeader>
            <CardTitle>מנהלים</CardTitle>
            <CardDescription>
              רשימת המנהלים של הארגון
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization.admins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>תפקיד</TableHead>
                    <TableHead>סטטוס</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.admins.map((admin: {
                    id: string;
                    name: string;
                    email: string;
                    role: string;
                    status: string;
                  }) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {admin.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabels[admin.role]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.status === "ACTIVE" ? "default" : "secondary"}
                        >
                          {admin.status === "ACTIVE" ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">אין מנהלים</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
