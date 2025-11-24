// app/employee/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActorType, ShiftStatus, TimeEventType } from "@prisma/client";

export default async function EmployeeHomePage() {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    // אם העוגייה לא תקפה – ננקה ונחזיר להתחברות
    cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
    redirect("/employee/login");
  }

  const openShift = await prisma.shift.findFirst({
    where: {
      employeeId: employee.id,
      status: ShiftStatus.OPEN,
    },
    orderBy: { startTime: "desc" },
  });

  const lastClosedShift = await prisma.shift.findFirst({
    where: {
      employeeId: employee.id,
      status: ShiftStatus.CLOSED,
    },
    orderBy: { endTime: "desc" },
  });

  async function clockIn() {
    "use server";

    const cookieStore = await cookies();
    const employeeId = cookieStore.get("employeeId")?.value;

    if (!employeeId) {
      redirect("/employee/login");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
      redirect("/employee/login");
    }

    const existingOpen = await prisma.shift.findFirst({
      where: {
        employeeId: employee.id,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingOpen) {
      redirect("/employee");
    }

    const now = new Date();

    const shift = await prisma.shift.create({
      data: {
        employeeId: employee.id,
        status: ShiftStatus.OPEN,
        startTime: now,
        source: "web",
      },
    });

    await prisma.timeEvent.create({
      data: {
        employeeId: employee.id,
        shiftId: shift.id,
        eventType: TimeEventType.CLOCK_IN,
        createdBy: ActorType.EMPLOYEE,
        time: now,
      },
    });

    redirect("/employee");
  }

  async function clockOut() {
    "use server";

    const cookieStore = await cookies();
    const employeeId = cookieStore.get("employeeId")?.value;

    if (!employeeId) {
      redirect("/employee/login");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
      redirect("/employee/login");
    }

    const openShift = await prisma.shift.findFirst({
      where: {
        employeeId: employee.id,
        status: ShiftStatus.OPEN,
      },
      orderBy: { startTime: "desc" },
    });

    if (!openShift) {
      redirect("/employee");
    }

    const now = new Date();

    await prisma.shift.update({
      where: { id: openShift.id },
      data: {
        endTime: now,
        status: ShiftStatus.CLOSED,
      },
    });

    await prisma.timeEvent.create({
      data: {
        employeeId: employee.id,
        shiftId: openShift.id,
        eventType: TimeEventType.CLOCK_OUT,
        createdBy: ActorType.EMPLOYEE,
        time: now,
      },
    });

    redirect("/employee");
  }

  const inShift = Boolean(openShift);
  const startedAt =
    openShift?.startTime &&
    openShift.startTime.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const lastShiftSummary =
    lastClosedShift && lastClosedShift.startTime && lastClosedShift.endTime
      ? `${lastClosedShift.startTime.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        })} – ${lastClosedShift.endTime.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40">
        <p className="text-xs text-slate-400">שלום,</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-50">
          {employee.fullName}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          כאן אתה יכול לדווח על כניסה ויציאה מהמשמרת, ולראות מידע עדכני על
          הסטטוס שלך.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${
                inShift ? "bg-emerald-500" : "bg-slate-500"
              } opacity-40 animate-ping`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                inShift ? "bg-emerald-400" : "bg-slate-400"
              }`}
            />
          </div>
          <span className="text-xs text-slate-300">
            {inShift
              ? startedAt
                ? `אתה כעת במשמרת, מאז ${startedAt}`
                : "אתה כעת במשמרת"
              : "אינך במשמרת כרגע"}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
        <form action={inShift ? clockOut : clockIn}>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-l from-violet-600 via-fuchsia-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-700/40 transition hover:brightness-110 hover:shadow-xl"
          >
            {inShift ? "יציאה מהמשמרת" : "כניסה למשמרת"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-xs text-slate-400">
          {lastShiftSummary && (
            <p>
              <span className="font-medium text-slate-300">
                המשמרת האחרונה:
              </span>{" "}
              {lastShiftSummary}
            </p>
          )}
          <p>
            בהמשך נוסיף כאן כפתורים להיסטוריית משמרות, משימות, העלאת מסמכים
            ועוד.
          </p>
        </div>
      </section>
    </div>
  );
}
