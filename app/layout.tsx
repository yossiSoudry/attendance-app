// app/layout.tsx
import { DirectionProvider } from "@/components/direction-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
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
      <body>
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

                <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-10">
                  <div className="mb-6 flex justify-end">
                    <ModeToggle />
                  </div>

                  {children}
                </main>
              </div>
            </NuqsAdapter>
          </DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
