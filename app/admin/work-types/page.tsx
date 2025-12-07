// app/admin/work-types/page.tsx
import { prisma } from "@/lib/prisma";
import {
  WorkTypesDataTable,
  type WorkTypeTableRow,
} from "./_components/work-types-data-table";
import { WorkTypeFormDialog } from "./_components/work-type-form-dialog";

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
    rateType: wt.rateType,
    rateValue: wt.rateValue,
    employeesCount: wt._count.employeeRates,
    shiftsCount: wt._count.shifts,
    createdAt: wt.createdAt.toISOString(),
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ניהול סוגי עבודה
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              הגדר סוגי עבודה שונים עם תעריפי שכר ייחודיים לכל עובד.
            </p>
          </div>
          <WorkTypeFormDialog mode="create" />
        </div>
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
          <WorkTypesDataTable data={rows} hideCreateButton />
        )}
      </section>
    </div>
  );
}