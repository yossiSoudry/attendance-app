// app/page.tsx
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { BlurFade } from "@/components/ui/blur-fade";
import { ArrowLeft, Clock, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Theme Toggle */}
        <BlurFade delay={0.1} inView>
          <div className="flex justify-end">
            <AnimatedThemeToggler />
          </div>
        </BlurFade>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border-2 bg-card p-8 shadow-md dark:shadow-secondary/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-sky-500/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg">
            <Clock className="h-8 w-8 text-white" />
          </div>

          <h1 className="bg-linear-to-l from-violet-400 via-sky-400 to-violet-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            מערכת נוכחות עובדים
          </h1>

          <p className="mt-3 max-w-md text-muted-foreground">
            מערכת חכמה לניהול שעות עבודה, מעקב משמרות ודיווח נוכחות בזמן אמת
          </p>
        </div>
      </section>

      {/* Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Employee Card */}
        <Link href="/employee/login" className="group">
          <section className="relative h-full overflow-hidden rounded-3xl border-2 bg-card p-6 shadow-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg dark:shadow-secondary/50">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-300 group-hover:bg-emerald-500/20"
            />

            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="h-6 w-6" />
              </div>

              <h2 className="text-xl font-semibold text-foreground">
                כניסת עובד
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                דיווח כניסה ויציאה, צפייה בהיסטוריית משמרות ומעקב שעות עבודה
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <span>המשך לדיווח</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </section>
        </Link>

        {/* Admin Card */}
        <Link href="/admin" className="group">
          <section className="relative h-full overflow-hidden rounded-3xl border-2 bg-card p-6 shadow-md transition-all duration-300 hover:border-violet-500/50 hover:shadow-lg dark:shadow-secondary/50">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl transition-all duration-300 group-hover:bg-violet-500/20"
            />

            <div className="relative z-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Shield className="h-6 w-6" />
              </div>

              <h2 className="text-xl font-semibold text-foreground">
                ממשק מנהל
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                ניהול עובדים, צפייה במשמרות, דוחות וייצוא נתונים
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                <span>כניסה לניהול</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </section>
        </Link>
      </div>

      {/* Features */}
      <section className="rounded-3xl border-2 bg-card p-6 shadow-md dark:shadow-secondary/50">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          יכולות המערכת
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "דיווח בזמן אמת",
              description: "כניסה ויציאה בלחיצת כפתור",
              color: "text-sky-500",
            },
            {
              title: "היסטוריה מלאה",
              description: "צפייה בכל המשמרות לפי תקופה",
              color: "text-emerald-500",
            },
            {
              title: "ייצוא דוחות",
              description: "הורדת נתונים ל-Excel",
              color: "text-violet-500",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border/50 bg-muted/30 p-4"
            >
              <h4 className={`font-medium ${feature.color}`}>
                {feature.title}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
