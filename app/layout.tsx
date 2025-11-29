// app/layout.tsx
import { DirectionProvider } from "@/components/direction-provider";
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
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DirectionProvider dir="rtl">
            <NuqsAdapter>{children}</NuqsAdapter>
          </DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
