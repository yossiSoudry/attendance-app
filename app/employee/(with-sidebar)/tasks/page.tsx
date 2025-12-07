// app/employee/(with-sidebar)/tasks/page.tsx
import { getEmployeeTasks } from "@/app/employee/_actions/task-actions";
import { EmployeeTasksList } from "./_components/employee-tasks-list";

export const dynamic = "force-dynamic";

export default async function EmployeeTasksPage() {
  // getEmployeeTasks now handles authentication internally
  const tasks = await getEmployeeTasks();

  const openTasks = tasks.filter((t) => t.status === "OPEN");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const otherTasks = tasks.filter(
    (t) => t.status !== "OPEN" && t.status !== "COMPLETED"
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-foreground">המשימות שלי</h1>
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
      />
    </div>
  );
}
