// app/contractor/layout.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContractorLayoutWrapper } from "./_components/contractor-layout-wrapper";

export default async function ContractorLayout({
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
    select: {
      fullName: true,
      employmentType: true,
      status: true,
      organization: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!employee) {
    redirect("/employee/login");
  }

  // Verify this is an HR contractor
  if (employee.employmentType !== "HR_CONTRACTOR") {
    redirect("/employee");
  }

  if (employee.status === "BLOCKED") {
    redirect("/employee/login?error=" + encodeURIComponent("החשבון שלך חסום"));
  }

  return (
    <ContractorLayoutWrapper
      contractorName={employee.fullName}
      organization={employee.organization}
    >
      {children}
    </ContractorLayoutWrapper>
  );
}
