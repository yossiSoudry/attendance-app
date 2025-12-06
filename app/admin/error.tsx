// app/admin/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">שגיאה בטעינת הדף</h1>

        <p className="mb-6 text-muted-foreground">
          אירעה שגיאה בעת טעינת דף הניהול. נסה לרענן או לחזור לדשבורד.
        </p>

        {error.digest && (
          <p className="mb-4 rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
            {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RefreshCw className="ml-2 h-4 w-4" />
            נסה שוב
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/dashboard">
              <LayoutDashboard className="ml-2 h-4 w-4" />
              חזרה לדשבורד
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
