// app/admin/page.tsx
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
        <h1 className="bg-gradient-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          ממשק מנהל – עובדים
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          זהו מסך בסיסי רק לוודא שהחיבור ל-DB ול-Prisma עובד. בהמשך נוסיף כאן
          דשבורד, פילטרים ופעולות עריכה.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
            <p>עדיין אין עובדים במערכת.</p>
            <p className="mt-1 text-xs text-slate-500">
              בקרוב נבנה כאן מסך ליצירת עובד חדש וניהול עובדים.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="px-3 py-2 text-xs font-semibold text-slate-400">
                    שם מלא
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-400">
                    תעודת זהות
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-400">
                    סטטוס
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-400">
                    שעה/בסיס (₪)
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-400">
                    נוצר בתאריך
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/60"
                  >
                    <td className="px-3 py-2 text-sm">{emp.fullName}</td>
                    <td className="px-3 py-2 text-sm">{emp.nationalId}</td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                          emp.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/10 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {emp.status === "ACTIVE" ? "פעיל" : "חסום"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {emp.baseHourlyRate
                        ? (emp.baseHourlyRate / 100).toFixed(2)
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {emp.createdAt.toLocaleDateString("he-IL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
