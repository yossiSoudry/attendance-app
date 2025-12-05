// app/not-found.tsx
import Link from "next/link";
import { FileQuestion, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative rounded-full bg-primary/10 p-6">
              <FileQuestion className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="mb-2 text-8xl font-bold text-primary">404</h1>

        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          הדף לא נמצא
        </h2>

        <p className="mb-8 text-muted-foreground">
          מצטערים, הדף שחיפשת לא קיים או שהועבר למיקום אחר.
          <br />
          בדוק שהכתובת נכונה או חזור לדף הבית.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="ml-2 h-5 w-5" />
              חזרה לדף הבית
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="javascript:history.back()">
              <ArrowRight className="ml-2 h-5 w-5" />
              חזרה לדף הקודם
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>צריך עזרה? פנה למנהל המערכת</p>
        </div>
      </div>
    </div>
  );
}
