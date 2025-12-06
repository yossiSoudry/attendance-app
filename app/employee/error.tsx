// app/employee/error.tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EmployeeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Employee error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">משהו השתבש</h1>

        <p className="mb-6 text-muted-foreground">
          אירעה שגיאה בטעינת הדף. נסה לרענן את הדף.
        </p>

        {error.digest && (
          <p className="mb-4 rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
            קוד: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RefreshCw className="ml-2 h-4 w-4" />
            נסה שוב
          </Button>

          <Button asChild variant="outline">
            <Link href="/employee">
              <Home className="ml-2 h-4 w-4" />
              חזרה לדף הבית
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
