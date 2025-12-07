// app/employee/_components/employee-sidebar.tsx
"use client";

import {
  Building2,
  Calculator,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  Download,
  History,
  Home,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  useSidebar,
} from "@/components/ui/sidebar";
import type { OrganizationInfo } from "./employee-layout-wrapper";

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
  organization: OrganizationInfo;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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

export function EmployeeSidebar({ employeeName, openTasksCount, organization }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);

    // Close sidebar on mobile after action
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navMain: NavItem[] = [
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
                {organization?.logoUrl ? (
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={organization.logoUrl} alt={organization.name} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                      <Building2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    <Building2 className="h-4 w-4" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold truncate max-w-[140px]">
                    {organization?.name || "ממשק עובד"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {employeeName}
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
                    <Link href={item.url} onClick={handleNavClick}>
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

        {/* Install App Button - only show if not installed and prompt is available */}
        {!isInstalled && deferredPrompt && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="התקן כאפליקציה"
                    onClick={handleInstallClick}
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    <Download className="h-4 w-4" />
                    <span>התקן כאפליקציה</span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                      {getInitials(employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-right text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {employeeName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      עובד
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
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                        {getInitials(employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-right text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {employeeName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {organization?.name || "עובד"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" onClick={handleNavClick}>
                    <Home className="h-4 w-4" />
                    דף הבית
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                  <Link href="/employee/login" onClick={handleNavClick}>
                    <LogOut className="h-4 w-4" />
                    יציאה
                  </Link>
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
