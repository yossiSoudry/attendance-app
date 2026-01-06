// app/employee/(with-sidebar)/layout.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmployeeLayoutWrapper } from "../_components/employee-layout-wrapper";

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

  const [employee, openTasksCount] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        fullName: true,
        employmentType: true,
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    }),
    prisma.task.count({
      where: { employeeId, status: "OPEN", isVisible: true, isTemplate: false },
    }),
  ]);

  if (!employee) {
    redirect("/employee/login");
  }

  // HR Contractors should use their dedicated interface
  if (employee.employmentType === "HR_CONTRACTOR") {
    redirect("/contractor");
  }

  return (
    <EmployeeLayoutWrapper
      employeeName={employee.fullName}
      openTasksCount={openTasksCount}
      organization={employee.organization}
    >
      {children}
    </EmployeeLayoutWrapper>
  );
}
