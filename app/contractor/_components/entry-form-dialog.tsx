// app/contractor/_components/entry-form-dialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
  casualWorkerEntryFormSchema,
  type CasualWorkerEntryFormValues,
} from "@/lib/validations/casual-worker-entry";
import {
  createCasualWorkerEntry,
  updateCasualWorkerEntry,
  type CasualWorkerEntryWithId,
} from "../_actions/contractor-actions";

type EntryFormDialogProps = {
  mode: "create" | "edit";
  entry?: CasualWorkerEntryWithId;
  workerNameSuggestions?: string[];
  trigger?: React.ReactNode;
};

export function EntryFormDialog({
  mode,
  entry,
  workerNameSuggestions = [],
  trigger,
}: EntryFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [workerNameOpen, setWorkerNameOpen] = React.useState(false);

  // Format time from Date to HH:MM string
  const formatTimeFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const form = useForm<CasualWorkerEntryFormValues>({
    resolver: zodResolver(casualWorkerEntryFormSchema),
    defaultValues: {
      workerName: entry?.workerName ?? "",
      workDate: entry?.workDate ? new Date(entry.workDate) : new Date(),
      startTime: entry?.startTime ? formatTimeFromDate(new Date(entry.startTime)) : "08:00",
      endTime: entry?.endTime ? formatTimeFromDate(new Date(entry.endTime)) : "16:00",
      notes: entry?.notes ?? "",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        workerName: entry?.workerName ?? "",
        workDate: entry?.workDate ? new Date(entry.workDate) : new Date(),
        startTime: entry?.startTime ? formatTimeFromDate(new Date(entry.startTime)) : "08:00",
        endTime: entry?.endTime ? formatTimeFromDate(new Date(entry.endTime)) : "16:00",
        notes: entry?.notes ?? "",
      });
    }
  }, [open, entry, form]);

  async function onSubmit(values: CasualWorkerEntryFormValues) {
    setIsPending(true);

    const result =
      mode === "create"
        ? await createCasualWorkerEntry(values)
        : await updateCasualWorkerEntry(entry!.id, values);

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof CasualWorkerEntryFormValues, {
            message: messages[0],
          });
        });
      }
    }
  }

  const defaultTrigger =
    mode === "create" ? (
      <Button className="h-9">
        <Plus className="ml-2 h-4 w-4" />
        הוסף רשומה
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <Pencil className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "הזנת שעות עבודה" : "עריכת רשומה"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "הזן את פרטי העבודה של העובד המזדמן"
              : "ערוך את פרטי הרשומה"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Worker Name with autocomplete */}
            <FormField
              control={form.control}
              name="workerName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>שם העובד</FormLabel>
                  <Popover open={workerNameOpen} onOpenChange={setWorkerNameOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "בחר או הקלד שם עובד"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="חפש או הקלד שם חדש..."
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                setWorkerNameOpen(false);
                              }}
                            >
                              השתמש ב&quot;{field.value}&quot;
                            </Button>
                          </CommandEmpty>
                          <CommandGroup heading="עובדים קודמים">
                            {workerNameSuggestions.map((name) => (
                              <CommandItem
                                key={name}
                                value={name}
                                onSelect={() => {
                                  field.onChange(name);
                                  setWorkerNameOpen(false);
                                }}
                              >
                                {name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Date */}
            <FormField
              control={form.control}
              name="workDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-right font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת התחלה</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        dir="ltr"
                        className="text-center"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת סיום</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        dir="ltr"
                        className="text-center"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערות נוספות..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "הוסף" : "שמור"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
