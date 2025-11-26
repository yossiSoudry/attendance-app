// app/employee/login/page.tsx
import WidgetDemo from "@/components/clock-05";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

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
  const raw = await searchParams;

  const errorParam = raw?.error;
  const error =
    Array.isArray(errorParam) && errorParam.length > 0
      ? errorParam[0]
      : typeof errorParam === "string"
        ? errorParam
        : undefined;

  return (
    <div className="flex flex-col">
      <header className="mb-10 flex w-full items-center justify-center">
        <WidgetDemo />
      </header>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-3xl bg-[conic-gradient(at_top,oklch(0.7_0.15_300/_0.65),transparent_35%,oklch(0.72_0.12_240/_0.7),transparent_70%,oklch(0.68_0.16_320/_0.65))] opacity-80 blur-[2px]"
          />

          <div className="relative border-2 whitespace-nowrap shadow-md dark:shadow-secondary/50 rounded-3xl bg-card/80 p-6 backdrop-blur-md sm:p-7">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-center text-lg font-semibold tracking-tight">
                כניסת עובד
              </h2>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {decodeURIComponent(error)}
              </div>
            )}

            <LoginForm />

            <div className="text-center mt-4 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <p>
                אם אינך מצליח להיכנס, פנה למעסיק כדי לוודא שמספר הזהות שלך
                מוגדר במערכת.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}