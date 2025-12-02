// app/employee/_components/employee-sidebar.tsx
"use client";

import {
  Calculator,
  ClipboardList,
  Clock,
  History,
  Home,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// ========================================
// Types
// ========================================

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type EmployeeSidebarProps = {
  employeeName: string;
  openTasksCount?: number;
};

// ========================================
// Component
// ========================================

export function EmployeeSidebar({ employeeName, openTasksCount }: EmployeeSidebarProps) {
  const pathname = usePathname();

  const navMain: NavItem[] = [
    {
      title: "דף הבית",
      url: "/",
      icon: Home,
    },
    {
      title: "משמרת נוכחית",
      url: "/employee",
      icon: Clock,
    },
    {
      title: "היסטוריית משמרות",
      url: "/employee/history",
      icon: History,
    },
    {
      title: "חישוב שכר",
      url: "/employee/payroll",
      icon: Calculator,
    },
    {
      title: "משימות",
      url: "/employee/tasks",
      icon: ClipboardList,
      badge: openTasksCount,
    },
  ];

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/employee">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{employeeName}</span>
                  <span className="text-xs text-muted-foreground">
                    ממשק עובד
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
              {navMain.map((item) => (
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
                  {item.badge !== undefined && item.badge > 0 && (
                    <SidebarMenuBadge className="!bg-red-500 !text-white">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="יציאה">
              <Link href="/employee/login">
                <LogOut className="h-4 w-4" />
                <span>יציאה</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
