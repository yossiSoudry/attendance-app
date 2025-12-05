// app/global-error.tsx
"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="bg-zinc-950 text-white">
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20" />
                <div className="relative rounded-full bg-red-500/10 p-6">
                  <AlertOctagon className="h-16 w-16 text-red-500" />
                </div>
              </div>
            </div>

            <h1 className="mb-2 text-4xl font-bold">
              שגיאה קריטית
            </h1>

            <h2 className="mb-4 text-xl font-medium text-zinc-400">
              המערכת נתקלה בבעיה
            </h2>

            <p className="mb-8 text-zinc-400">
              מצטערים, אירעה שגיאה בלתי צפויה במערכת.
              <br />
              אנא רענן את הדף או נסה שוב מאוחר יותר.
            </p>

            {error.digest && (
              <p className="mb-6 rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-500">
                קוד שגיאה: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              <RefreshCw className="h-5 w-5" />
              נסה שוב
            </button>

            <div className="mt-12 text-sm text-zinc-500">
              <p>אם הבעיה חוזרת, פנה למנהל המערכת</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
