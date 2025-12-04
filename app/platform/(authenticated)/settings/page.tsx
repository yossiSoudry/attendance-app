// app/platform/(authenticated)/settings/page.tsx
import { Settings, Construction } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground">
          הגדרות כלליות של הפלטפורמה
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            בקרוב
          </CardTitle>
          <CardDescription>
            דף ההגדרות נמצא בפיתוח
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Settings className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">הגדרות הפלטפורמה</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              כאן יהיה ניתן להגדיר הגדרות כלליות כמו שם הפלטפורמה, לוגו,
              הגדרות אימייל, ועוד.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
