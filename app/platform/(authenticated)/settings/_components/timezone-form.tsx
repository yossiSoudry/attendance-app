// app/platform/(authenticated)/settings/_components/timezone-form.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updatePlatformSettings } from "@/app/platform/_actions/platform-settings-actions";
import { COMMON_TIMEZONES } from "@/lib/timezones";

interface TimezoneFormProps {
  currentTimezone: string;
}

export function TimezoneForm({ currentTimezone }: TimezoneFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(currentTimezone);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const selectedTimezone = COMMON_TIMEZONES.find((tz) => tz.value === value);

  async function handleSave() {
    if (value === currentTimezone) return;

    setIsPending(true);
    setError(null);
    setSuccess(false);

    const result = await updatePlatformSettings({ timezone: value });

    if (result.success) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "שגיאה בעדכון");
    }

    setIsPending(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between sm:w-[300px]"
              disabled={isPending}
            >
              {selectedTimezone ? (
                <span className="flex items-center gap-2">
                  <span>{selectedTimezone.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedTimezone.offset})
                  </span>
                </span>
              ) : (
                "בחר אזור זמן..."
              )}
              <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="חפש אזור זמן..." />
              <CommandList>
                <CommandEmpty>לא נמצא אזור זמן</CommandEmpty>
                <CommandGroup>
                  {COMMON_TIMEZONES.map((tz) => (
                    <CommandItem
                      key={tz.value}
                      value={tz.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === tz.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{tz.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {tz.offset}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSave}
          disabled={isPending || value === currentTimezone}
        >
          {isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              שומר...
            </>
          ) : (
            "שמור"
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          אזור הזמן עודכן בהצלחה
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        אזור הזמן משפיע על הצגת השעות בכל המערכת - כניסות, יציאות, משמרות
        ודוחות.
      </p>
    </div>
  );
}
