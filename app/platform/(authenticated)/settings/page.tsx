// app/platform/(authenticated)/settings/page.tsx
import { Settings, Globe, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformSettings } from "@/app/platform/_actions/platform-settings-actions";
import { TimezoneForm } from "./_components/timezone-form";

export default async function PlatformSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground">הגדרות כלליות של הפלטפורמה</p>
      </div>

      {/* Timezone Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            אזור זמן
          </CardTitle>
          <CardDescription>
            הגדר את אזור הזמן הכללי של המערכת. כל השעות במערכת יוצגו לפי אזור זמן
            זה.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimezoneForm currentTimezone={settings.timezone} />
        </CardContent>
      </Card>

      {/* Current Time Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            זמן נוכחי
          </CardTitle>
          <CardDescription>
            השעה הנוכחית לפי אזור הזמן שנבחר
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentTimeDisplay timezone={settings.timezone} />
        </CardContent>
      </Card>

      {/* Future Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            הגדרות נוספות
          </CardTitle>
          <CardDescription>הגדרות נוספות יתווספו בקרוב</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Settings className="h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">
              הגדרות נוספות כמו שם הפלטפורמה, לוגו, והגדרות אימייל יתווספו
              בגרסאות הבאות.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CurrentTimeDisplay({ timezone }: { timezone: string }) {
  const now = new Date();
  const formattedTime = now.toLocaleString("he-IL", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="text-center">
      <p className="text-2xl font-semibold">{formattedTime}</p>
      <p className="mt-1 text-sm text-muted-foreground">אזור זמן: {timezone}</p>
    </div>
  );
}
