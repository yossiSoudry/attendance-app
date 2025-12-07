// app/employee/leave/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { LeaveRequestForm } from "./_components/leave-request-form";
import { LeaveRequestsList } from "./_components/leave-requests-list";
import { getMyLeaveRequests } from "../_actions/leave-actions";

export const dynamic = "force-dynamic";

export default async function EmployeeLeavePage() {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, fullName: true },
  });

  if (!employee) {
    redirect("/employee/login");
  }

  const requests = await getMyLeaveRequests();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Header */}
      <section className="rounded-3xl border-2 bg-card p-6 shadow-md dark:shadow-secondary/50 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">בקשות חופשה</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              הגש בקשה לחופשה או מחלה וצפה בסטטוס הבקשות שלך
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/employee" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה
            </Link>
          </Button>
        </div>
      </section>

      {/* Form */}
      <LeaveRequestForm />

      {/* Requests List */}
      <LeaveRequestsList requests={requests} />
    </div>
  );
}
