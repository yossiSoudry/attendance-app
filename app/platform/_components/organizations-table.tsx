// app/platform/_components/organizations-table.tsx
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Users, UserCog, Building2 } from "lucide-react";
import Link from "next/link";
import type { OrganizationWithStats } from "../_actions/organization-actions";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface OrganizationsTableProps {
  organizations: OrganizationWithStats[];
}

const statusLabels: Record<string, string> = {
  ACTIVE: "פעיל",
  SUSPENDED: "מושעה",
  TRIAL: "ניסיון",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
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

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>שם הארגון</TableHead>
          <TableHead>אימייל</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead>תוכנית</TableHead>
          <TableHead>עובדים</TableHead>
          <TableHead>מנהלים</TableHead>
          <TableHead>תאריך יצירה</TableHead>
          <TableHead>פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {org.logoUrl ? (
                    <AvatarImage src={org.logoUrl} alt={org.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(org.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{org.name}</span>
              </div>
            </TableCell>
            <TableCell>{org.email}</TableCell>
            <TableCell>
              <Badge variant={statusVariants[org.status]}>
                {statusLabels[org.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{planLabels[org.plan]}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {org._count.employees}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                {org._count.admins}
              </div>
            </TableCell>
            <TableCell>
              {new Date(org.createdAt).toLocaleDateString("he-IL")}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/platform/organizations/${org.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
