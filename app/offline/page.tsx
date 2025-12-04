// app/offline/page.tsx
"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">אין חיבור לאינטרנט</h1>
        <p className="text-muted-foreground">
          נראה שאין לך חיבור לאינטרנט כרגע.
          <br />
          בדוק את החיבור שלך ונסה שוב.
        </p>
      </div>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="gap-2"
      >
        נסה שוב
      </Button>
    </div>
  );
}
