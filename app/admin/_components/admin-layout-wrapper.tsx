// app/admin/_components/admin-layout-wrapper.tsx
"use client";

import { AppNavbar } from "@/components/app-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import { AdminSidebar } from "./admin-sidebar";
import type { OrganizationInfo } from "../_actions/dashboard-actions";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  organization: OrganizationInfo | null;
}

export function AdminLayoutWrapper({ children, organization }: AdminLayoutWrapperProps) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AdminSidebar organization={organization} />
        <SidebarInset>
          <AppNavbar
            breadcrumbs={[
              { label: organization?.name || "ממשק מנהל", href: "/admin" },
            ]}
          />
          <div className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
