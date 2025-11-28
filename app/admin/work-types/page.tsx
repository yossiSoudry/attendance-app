// app/admin/work-types/page.tsx
import { prisma } from "@/lib/prisma";
import {
  WorkTypesDataTable,
  type WorkTypeTableRow,
} from "./_components/work-types-data-table";

export const dynamic = "force-dynamic";

export default async function WorkTypesPage() {
  const workTypes = await prisma.workType.findMany({
    include: {
      _count: {
        select: {
          employeeRates: true,
          shifts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: WorkTypeTableRow[] = workTypes.map((wt: typeof workTypes[number]) => ({
    id: wt.id,
    name: wt.name,
    description: wt.description,
    isDefault: wt.isDefault,
    employeesCount: wt._count.employeeRates,
    shiftsCount: wt._count.shifts,
    createdAt: wt.createdAt.toISOString(),
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          ניהול סוגי עבודה
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          הגדר סוגי עבודה שונים עם תעריפי שכר ייחודיים לכל עובד.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>עדיין אין סוגי עבודה במערכת.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              לחץ על &quot;סוג עבודה חדש&quot; כדי להוסיף את הראשון.
            </p>
          </div>
        ) : (
          <WorkTypesDataTable data={rows} />
        )}
      </section>
    </div>
  );
}