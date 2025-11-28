// app/admin/_components/bonus-form-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon, Gift, Loader2, Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogIcon } from "@/components/ui/dialog-icon";
import { cn } from "@/lib/utils";

import { bonusFormSchema, type BonusFormValues } from "@/lib/validations/bonus";
import {
    createBonus,
    updateBonus,
    type ActionResult,
    type BonusWithDetails,
} from "../_actions/bonus-actions";

type BonusFormDialogProps = {
  mode: "create" | "edit";
  employeeId: string;
  bonus?: BonusWithDetails;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function BonusFormDialog({
  mode,
  employeeId,
  bonus,
  trigger,
  onSuccess,
}: BonusFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<BonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: {
      bonusType: bonus?.bonusType ?? "HOURLY",
      amountPerHour: bonus?.amountPerHour ?? undefined,
      amountFixed: bonus?.amountFixed ?? undefined,
      validFrom: bonus?.validFrom ? new Date(bonus.validFrom) : new Date(),
      validTo: bonus?.validTo
        ? new Date(bonus.validTo)
        : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      description: bonus?.description ?? "",
    },
  });

  const watchedBonusType = useWatch({
    control: form.control,
    name: "bonusType",
    defaultValue: bonus?.bonusType ?? "HOURLY",
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        bonusType: bonus?.bonusType ?? "HOURLY",
        amountPerHour: bonus?.amountPerHour ?? undefined,
        amountFixed: bonus?.amountFixed ?? undefined,
        validFrom: bonus?.validFrom ? new Date(bonus.validFrom) : new Date(),
        validTo: bonus?.validTo
          ? new Date(bonus.validTo)
          : new Date(new Date().setMonth(new Date().getMonth() + 1)),
        description: bonus?.description ?? "",
      });
    }
  }, [open, bonus, form]);

  async function onSubmit(values: BonusFormValues) {
    setIsPending(true);

    let result: ActionResult;

    if (mode === "create") {
      result = await createBonus(employeeId, values);
    } else {
      result = await updateBonus(bonus!.id, values);
    }

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      form.reset();
      onSuccess?.();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof BonusFormValues, {
            message: messages[0],
          });
        });
      }
    }
  }

  const defaultTrigger =
    mode === "create" ? (
      <Button size="sm" className="h-8">
        <Plus className="ml-2 h-4 w-4" />
        בונוס חדש
      </Button>
    ) : (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Pencil className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogIcon variant="success">
            <Gift className="h-5 w-5" />
          </DialogIcon>
          <DialogTitle>
            {mode === "create" ? "הוספת בונוס חדש" : "עריכת בונוס"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "הגדר בונוס חדש לעובד"
              : "ערוך את פרטי הבונוס"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bonusType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג בונוס</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג בונוס" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HOURLY">בונוס לשעה</SelectItem>
                      <SelectItem value="ONE_TIME">בונוס חד-פעמי</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {watchedBonusType === "HOURLY"
                      ? "סכום נוסף לכל שעת עבודה"
                      : "סכום קבוע לתקופה"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedBonusType === "HOURLY" && (
              <FormField
                control={form.control}
                name="amountPerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום לשעה (₪)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="5.00"
                        dir="ltr"
                        className="text-left"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedBonusType === "ONE_TIME" && (
              <FormField
                control={form.control}
                name="amountFixed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום קבוע (₪)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="500.00"
                        dir="ltr"
                        className="text-left"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>מתאריך</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: he })
                            ) : (
                              <span>בחר תאריך</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={he}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>עד תאריך</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: he })
                            ) : (
                              <span>בחר תאריך</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={he}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="סיבת הבונוס..."
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
                {mode === "create" ? "הוסף בונוס" : "שמור שינויים"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}