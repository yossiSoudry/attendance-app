// app/employee/(with-sidebar)/tasks/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEmployeeTasks } from "@/app/employee/_actions/task-actions";
import { EmployeeTasksList } from "./_components/employee-tasks-list";

export const dynamic = "force-dynamic";

export default async function EmployeeTasksPage() {
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

  const tasks = await getEmployeeTasks(employee.id);

  const openTasks = tasks.filter((t) => t.status === "OPEN");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const otherTasks = tasks.filter(
    (t) => t.status !== "OPEN" && t.status !== "COMPLETED"
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">המשימות שלי</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {openTasks.length > 0
              ? `יש לך ${openTasks.length} משימות פתוחות`
              : "אין לך משימות פתוחות כרגע"}
          </p>
        </div>
      </section>

      <EmployeeTasksList
        openTasks={openTasks}
        completedTasks={completedTasks}
        otherTasks={otherTasks}
        employeeId={employee.id}
      />
    </div>
  );
}
