"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import type { AdminRole } from "@prisma/client";

interface AdminHeaderProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
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

  async function handleSignOut() {
    await signOut({ callbackUrl: "/admin/login" });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1">
          <RoleIcon className="size-3" />
          {roleLabels[user.role]}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-5 rounded-full"
                />
              ) : (
                <User className="size-4" />
              )}
              <span className="hidden sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              התנתק
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
