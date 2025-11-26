// app/layout.tsx
import { DirectionProvider } from "@/components/direction-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { BlurFade } from "@/components/ui/blur-fade";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance App",
  description: "מערכת נוכחות עובדים",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DirectionProvider dir="rtl">
            <NuqsAdapter>
              <div className="min-h-screen">
                {/* כאן אפשר להוסיף גרדיאנט גלובלי אם הגדרת page-gradient ב-globals.css */}
                {/* <div className="page-gradient min-h-screen"> */}
                {/*   <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-10"> */}
                {/*     {children} */}
                {/*   </main> */}
                {/* </div> */}

                {/* בינתיים: עטיפה בסיסית ונקייה */}

                <main className="mx-auto flex min-h-screen w-full container flex-col px-4 py-10 sm:px-6 lg:px-10">
                  <BlurFade delay={0.25} inView>
                    <div className="mb-6 flex justify-end">
                      {/* <ModeToggle /> */}
                      <AnimatedThemeToggler />
                    </div>
                    {children}
                  </BlurFade>
                </main>
              </div>
            </NuqsAdapter>
          </DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
