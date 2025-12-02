// components/app-navbar.tsx
"use client";

import { useSession } from "next-auth/react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationsBell } from "@/app/admin/_components/notifications-bell";

// ========================================
// Types
// ========================================

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppNavbarProps = {
  breadcrumbs?: BreadcrumbItem[];
};

// ========================================
// Component
// ========================================

export function AppNavbar({ breadcrumbs = [] }: AppNavbarProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role !== undefined;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-mr-1" />
        {breadcrumbs.length > 0 && (
          <>
            <Separator
              orientation="vertical"
              className="ml-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <BreadcrumbItem key={index}>
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    {item.href ? (
                      <BreadcrumbLink href={item.href} className="hidden md:block">
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-4">
        {isAdmin && <NotificationsBell />}
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}
