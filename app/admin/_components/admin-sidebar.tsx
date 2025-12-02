// app/admin/_components/admin-sidebar.tsx
"use client";

import * as React from "react";
import {
  Briefcase,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Umbrella,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { AdminRole } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// ========================================
// Types
// ========================================

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

// ========================================
// Navigation Data
// ========================================

const navMain: NavItem[] = [
  {
    title: "דשבורד",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "עובדים",
    url: "/admin",
    icon: Users,
  },
  {
    title: "משמרות",
    url: "/admin/shifts",
    icon: Clock,
  },
  {
    title: "חישוב שכר",
    url: "/admin/payroll",
    icon: Calculator,
  },
  {
    title: "חופשות ומחלה",
    url: "/admin/leave",
    icon: Umbrella,
  },
  {
    title: "משימות",
    url: "/admin/tasks",
    icon: ClipboardList,
  },
  {
    title: "סוגי עבודה",
    url: "/admin/work-types",
    icon: Briefcase,
  },
  {
    title: "לוח שנה",
    url: "/admin/calendar",
    icon: CalendarDays,
  },
];

// Helper to check if user can manage admins
function canManageAdmins(role: AdminRole | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

const roleLabels: Record<AdminRole, string> = {
  OWNER: "בעל המערכת",
  ADMIN: "מנהל מערכת",
  MANAGER: "מנהל מחלקה",
};

// Get initials from name
function getInitials(name: string | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ========================================
// Component
// ========================================

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as AdminRole | undefined;
  const showTeamManagement = canManageAdmins(userRole);

  async function handleSignOut() {
    await signOut({ callbackUrl: "/admin/login" });
  }

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white">
                  <Settings className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ממשק מנהל</span>
                  <span className="text-xs text-muted-foreground">
                    ניהול המערכת
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניווט</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) =>
                item.items ? (
                  <Collapsible key={item.title} defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.url)}
                          tooltip={item.title}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Team Management - only for OWNER/ADMIN */}
        {showTeamManagement && (
          <SidebarGroup>
            <SidebarGroupLabel>ניהול</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/team"}
                    tooltip="ניהול צוות"
                  >
                    <Link href="/admin/team">
                      <UsersRound className="h-4 w-4" />
                      <span>ניהול צוות</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="חזרה לדף הבית">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>חזרה לדף הבית</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image || undefined}
                      alt={session?.user?.name || "משתמש"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-right text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name || "משתמש"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userRole ? roleLabels[userRole] : ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="mr-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-right text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={session?.user?.image || undefined}
                        alt={session?.user?.name || "משתמש"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-right text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.user?.name || "משתמש"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session?.user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
