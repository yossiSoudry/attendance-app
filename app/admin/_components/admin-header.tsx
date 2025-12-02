import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminRole } from "@prisma/client";

interface AdminHeaderProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      role: AdminRole;
    };
  };
}

const roleLabels: Record<AdminRole, string> = {
  OWNER: "בעל המערכת",
  ADMIN: "מנהל מערכת",
  MANAGER: "מנהל מחלקה",
};

const roleIcons: Record<AdminRole, typeof Shield> = {
  OWNER: ShieldAlert,
  ADMIN: ShieldCheck,
  MANAGER: Shield,
};

export function AdminHeader({ session }: AdminHeaderProps) {
  const { user } = session;
  const RoleIcon = roleIcons[user.role];

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="gap-1">
        <RoleIcon className="size-3" />
        {roleLabels[user.role]}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {user.name}
      </span>
    </div>
  );
}
