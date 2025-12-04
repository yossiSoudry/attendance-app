// app/employee/_components/employee-layout-wrapper.tsx
"use client";

import { AppNavbar } from "@/components/app-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import { EmployeeSidebar } from "./employee-sidebar";

export type OrganizationInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
};

interface EmployeeLayoutWrapperProps {
  children: React.ReactNode;
  employeeName: string;
  openTasksCount: number;
  organization: OrganizationInfo;
}

export function EmployeeLayoutWrapper({
  children,
  employeeName,
  openTasksCount,
  organization,
}: EmployeeLayoutWrapperProps) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <EmployeeSidebar
          employeeName={employeeName}
          openTasksCount={openTasksCount}
          organization={organization}
        />
        <SidebarInset>
          <AppNavbar
            breadcrumbs={[{ label: organization.name, href: "/employee" }]}
          />
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
