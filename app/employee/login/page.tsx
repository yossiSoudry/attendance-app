// app/employee/login/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: {
    error?: string;
  };
};

export default async function EmployeeLoginPage({ searchParams }: Props) {
  async function login(formData: FormData) {
    "use server";

    const rawId = formData.get("nationalId");
    const nationalId = String(rawId ?? "").trim();

    if (!nationalId) {
      redirect("/employee/login?error=missing");
    }

    const employee = await prisma.employee.findUnique({
      where: { nationalId },
    });

    if (!employee) {
      // בשלב ראשון: אם אין עובד כזה – נחזיר שגיאה
      // (בהמשך ניצור מסך מנהל ליצירת עובדים)
      redirect("/employee/login?error=notfound");
    }

    const cookieStore = await cookies();

    cookieStore.set("employeeId", employee.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 יום
    });

    redirect("/employee");
  }

  const error = searchParams?.error;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40">
      <div>
        <h1 className="bg-gradient-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
          כניסת עובד
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          הכניסה מתבצעת באמצעות תעודת זהות בלבד. בהמשך נוסיף אימותים נוספים
          לפי הצורך.
        </p>
      </div>

      {error === "notfound" && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          לא נמצא עובד עם מספר תעודת הזהות הזה. ודא שהעובד מוגדר במערכת.
        </div>
      )}

      {error === "missing" && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          נא להזין מספר תעודת זהות.
        </div>
      )}

      <form action={login} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="nationalId"
            className="text-sm font-medium text-slate-200"
          >
            תעודת זהות
          </label>
          <input
            id="nationalId"
            name="nationalId"
            dir="ltr"
            inputMode="numeric"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
            placeholder="123456789"
          />
          <p className="text-xs text-slate-500">
            זהו שדה פנימי בלבד. המערכת מיועדת לשימוש בתוך הארגון.
          </p>
        </div>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-l from-violet-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-700/40 transition hover:brightness-110 hover:shadow-xl"
        >
          כניסה לאזור האישי
        </button>
      </form>
    </div>
  );
}
