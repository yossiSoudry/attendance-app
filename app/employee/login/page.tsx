// app/employee/login/page.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "כניסת עובד | מערכת נוכחות",
};

type RawSearchParams = {
  error?: string | string[];
};

type PageProps = {
  searchParams: Promise<RawSearchParams>;
};

export default async function EmployeeLoginPage({ searchParams }: PageProps) {
  // 👇 כאן התיקון: searchParams הוא Promise, אז צריך await
  const raw = await searchParams;

  const errorParam = raw?.error;
  const error =
    Array.isArray(errorParam) && errorParam.length > 0
      ? errorParam[0]
      : typeof errorParam === "string"
      ? errorParam
      : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      {/* כותרת עליונה */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            מערכת נוכחות עובדים
          </h1>
          <p className="text-sm text-muted-foreground">
            כניסה לאזור האישי באמצעות מספר תעודת זהות.
          </p>
        </div>
      </header>

      {/* תוכן מרכזי */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          {/* רקע גרדיאנט עדין סביב הכרטיס */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-3xl bg-[conic-gradient(at_top,oklch(0.7_0.15_300/_0.65),transparent_35%,oklch(0.72_0.12_240/_0.7),transparent_70%,oklch(0.68_0.16_320/_0.65))] opacity-80 blur-[2px]"
          />

          {/* כרטיס התחברות */}
          <div className="relative rounded-3xl border border-border bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-md sm:p-7">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">
                כניסת עובד
              </h2>
              <p className="text-xs text-muted-foreground">
                הזן את מספר תעודת הזהות שלך כדי להיכנס למערכת.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {decodeURIComponent(error)}
              </div>
            )}

            <form className="space-y-4" action="/employee/auth" method="post">
              <div className="space-y-2">
                <label
                  htmlFor="nationalId"
                  className="block text-xs font-medium text-foreground/90"
                >
                  מספר תעודת זהות
                </label>
                <Input
                  id="nationalId"
                  name="nationalId"
                  inputMode="numeric"
                  autoComplete="off"
                  dir="ltr"
                  placeholder="הקלד מספר זהות"
                  className="text-left"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  המערכת מזהה אותך לפי מספר הזהות בלבד. אין צורך בסיסמה.
                </p>
              </div>

              <Button
                type="submit"
                className="mt-2 w-full bg-linear-to-l from-sky-500 via-violet-500 to-fuchsia-500 text-sm font-medium text-white shadow-lg shadow-sky-500/25 transition hover:shadow-fuchsia-500/30"
              >
                כניסה לאזור האישי
              </Button>
            </form>

            <div className="mt-4 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <p>
                אם אינך מצליח להיכנס, פנה למנהל המערכת כדי לוודא שמספר הזהות שלך
                מוגדר במערכת.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
