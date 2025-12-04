// app/layout.tsx
import { DirectionProvider } from "@/components/direction-provider";
import { PWARegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: "מערכת נוכחות",
  description: "מערכת נוכחות עובדים - דיווח משמרות, חישוב שכר ומעקב נוכחות",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "נוכחות",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <PWARegister />
      </body>
    </html>
  );
}
