// app/contractor/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";
import { EntryList } from "../_components/entry-list";
import { MonthlySummary } from "../_components/monthly-summary";
import {
  getContractorAvailableMonths,
  getContractorMonthlyEntries,
  getContractorMonthlySummary,
  getWorkerNameSuggestions,
  type MonthOption,
  type CasualWorkerEntryWithId,
} from "../_actions/contractor-actions";
import type { ContractorPayrollSummary } from "@/lib/calculations/contractor-payroll";
import { formatAgorotToShekels } from "@/lib/calculations/contractor-payroll";

export default function ContractorHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [entries, setEntries] = useState<CasualWorkerEntryWithId[]>([]);
  const [summary, setSummary] = useState<ContractorPayrollSummary | null>(null);
  const [workerNames, setWorkerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number>(0);

  // Load available months on mount
  useEffect(() => {
    async function loadMonths() {
      const months = await getContractorAvailableMonths();
      setAvailableMonths(months);

      // Get initial month from URL or default to first available
      const urlYear = searchParams.get("year");
      const urlMonth = searchParams.get("month");

      if (urlYear && urlMonth) {
        setSelectedMonth(`${urlYear}-${urlMonth}`);
      } else if (months.length > 0) {
        setSelectedMonth(`${months[0].year}-${months[0].month}`);
      }
      setLoading(false);
    }
    loadMonths();
  }, [searchParams]);

  // Load data when month changes
  useEffect(() => {
    async function loadData() {
      if (!selectedMonth) return;

      setLoading(true);
      const [year, month] = selectedMonth.split("-").map(Number);

      const [entriesData, summaryData, namesData] = await Promise.all([
        getContractorMonthlyEntries(year, month),
        getContractorMonthlySummary(year, month),
        getWorkerNameSuggestions(),
      ]);

      setEntries(entriesData);
      setSummary(summaryData);
      setWorkerNames(namesData);
      if (summaryData) {
        setHourlyRate(summaryData.hourlyRate);
      }
      setLoading(false);

      // Update URL
      router.replace(`/contractor/history?year=${year}&month=${month}`, {
        scroll: false,
      });
    }
    loadData();
  }, [selectedMonth, router]);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  const selectedMonthOption = availableMonths.find(
    (m) => `${m.year}-${m.month}` === selectedMonth
  );

  if (loading && availableMonths.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (availableMonths.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" />
            היסטוריה
          </h1>
          <p className="text-muted-foreground">צפה בשעות עבודה לפי חודש</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">אין נתונים היסטוריים</p>
            <p className="text-sm text-muted-foreground">
              התחל להזין שעות כדי לראות היסטוריה
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" />
            היסטוריה
          </h1>
          <p className="text-muted-foreground">צפה בשעות עבודה לפי חודש</p>
        </div>

        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="בחר חודש" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem
                key={`${month.year}-${month.month}`}
                value={`${month.year}-${month.month}`}
              >
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-muted-foreground">טוען נתונים...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Monthly Summary */}
          {summary && selectedMonthOption && (
            <MonthlySummary
              summary={summary}
              monthLabel={selectedMonthOption.label}
              hourlyRateDisplay={formatAgorotToShekels(hourlyRate)}
            />
          )}

          {/* Entry List */}
          <EntryList entries={entries} workerNameSuggestions={workerNames} />
        </>
      )}
    </div>
  );
}
