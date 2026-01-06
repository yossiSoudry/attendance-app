// app/contractor/_components/contractor-layout-wrapper.tsx
"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ContractorNavbar } from "./contractor-navbar";
import { ContractorSidebar } from "./contractor-sidebar";

export type OrganizationInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
};

interface ContractorLayoutWrapperProps {
  children: React.ReactNode;
  contractorName: string;
  organization: OrganizationInfo;
}

export function ContractorLayoutWrapper({
  children,
  contractorName,
  organization,
}: ContractorLayoutWrapperProps) {
  return (
    <SidebarProvider>
      <ContractorSidebar
        contractorName={contractorName}
        organization={organization}
      />
      <SidebarInset>
        <ContractorNavbar
          breadcrumbs={[{ label: organization.name, href: "/contractor" }]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
