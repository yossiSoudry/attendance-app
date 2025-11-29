// app/employee/(with-sidebar)/layout.tsx
import { AppNavbar } from "@/components/app-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmployeeSidebar } from "../_components/employee-sidebar";

export default async function EmployeeWithSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { fullName: true },
  });

  if (!employee) {
    redirect("/employee/login");
  }

  return (
    <SidebarProvider>
      <EmployeeSidebar employeeName={employee.fullName} />
      <SidebarInset>
        <AppNavbar
          breadcrumbs={[
            { label: "ממשק עובד", href: "/employee" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
