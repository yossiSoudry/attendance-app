// app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/20" />
            <div className="relative rounded-full bg-destructive/10 p-6">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold text-foreground">
          משהו השתבש
        </h1>

        <h2 className="mb-4 text-xl font-medium text-muted-foreground">
          אירעה שגיאה בלתי צפויה
        </h2>

        <p className="mb-8 text-muted-foreground">
          מצטערים, נתקלנו בבעיה בעת טעינת הדף.
          <br />
          נסה לרענן את הדף או לחזור לדף הבית.
        </p>

        {error.digest && (
          <p className="mb-6 rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
            קוד שגיאה: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg">
            <RefreshCw className="ml-2 h-5 w-5" />
            נסה שוב
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="ml-2 h-5 w-5" />
              חזרה לדף הבית
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>אם הבעיה חוזרת, פנה למנהל המערכת</p>
        </div>
      </div>
    </div>
  );
}
