// app/employee/login/login-form.tsx
"use client";

import { Input } from "@/components/ui/input";
import { StatefulButton } from "@/components/ui/stateful-button";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isShabbat(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  // יום שישי (5) אחרי 16:30
  if (day === 5 && currentTime >= 16 * 60 + 30) {
    return true;
  }

  // יום שבת (6) לפני 18:00
  if (day === 6 && currentTime < 18 * 60) {
    return true;
  }

  return false;
}

export function LoginForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShabbatMode, setIsShabbatMode] = useState(() => isShabbat());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsShabbatMode(isShabbat());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // מאפשר רק ספרות
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 9);
    setError(null);
  };

  const handleLogin = async () => {
    if (isShabbatMode) {
      setError("המערכת אינה פעילה בשבת");
      return;
    }

    const nationalId = inputRef.current?.value;

    if (!nationalId) {
      setError("יש להזין מספר זהות");
      return;
    }

    if (nationalId.length !== 9) {
      setError("מספר זהות חייב להכיל 9 ספרות");
      return;
    }

    setError(null);

    const response = await fetch("/employee/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ nationalId }),
    });

    if (response.redirected) {
      router.push(response.url);
    } else if (!response.ok) {
      setError("המשתמש לא זוהה במערכת");
    }
  };

  return (
    <div className="space-y-4">
      {isShabbatMode && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-600 dark:text-amber-400">
          המערכת אינה פעילה משישי 16:30 עד שבת 18:00
        </div>
      )}

      <div className="space-y-2">
        <Input
          ref={inputRef}
          id="nationalId"
          name="nationalId"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder="הקלד מספר זהות"
          className="text-center"
          onChange={handleInputChange}
          disabled={isShabbatMode}
          required
        />
        <p className="text-[11px] text-muted-foreground text-center">
          המערכת מזהה אותך לפי מספר הזהות בלבד. אין צורך בסיסמה.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
          {error}
        </div>
      )}

      <StatefulButton
        type="button"
        className="mt-2 w-full text-sm"
        onClick={handleLogin}
        disabled={isShabbatMode}
      >
        כניסה לאזור האישי
      </StatefulButton>
    </div>
  );
}
