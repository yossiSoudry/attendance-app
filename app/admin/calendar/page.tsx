// app/admin/calendar/page.tsx
import { prisma } from "@/lib/prisma";
import {
  CalendarDataTable,
  type CalendarEventTableRow,
} from "./_components/calendar-data-table";
import { PopulateHolidaysButton } from "./_components/populate-holidays-button";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const currentYear = new Date().getFullYear();

  const events = await prisma.calendarEvent.findMany({
    orderBy: { gregorianDate: "asc" },
  });

  const rows: CalendarEventTableRow[] = events.map((event) => ({
    id: event.id,
    gregorianDate: event.gregorianDate.toISOString(),
    hebrewDate: event.hebrewDate,
    eventType: event.eventType,
    nameHe: event.nameHe,
    nameEn: event.nameEn,
    isRestDay: event.isRestDay,
    isShortDay: event.isShortDay,
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
              לוח שנה וחגים
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              נהל חגים, צומות ואירועים מיוחדים שמשפיעים על חישובי שכר ושעות עבודה.
            </p>
          </div>
          <PopulateHolidaysButton year={currentYear} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>עדיין אין אירועים בלוח השנה.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              לחץ על &quot;טען חגים {currentYear}&quot; כדי להוסיף את החגים העבריים
              אוטומטית, או הוסף אירועים באופן ידני.
            </p>
          </div>
        ) : (
          <CalendarDataTable data={rows} />
        )}
      </section>
    </div>
  );
}
