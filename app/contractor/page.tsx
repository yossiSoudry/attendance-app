// app/contractor/page.tsx
import { getAuthenticatedContractor } from "@/lib/contractor-auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import {
  getContractorMonthlyEntries,
  getContractorMonthlySummary,
  getWorkerNameSuggestions,
} from "./_actions/contractor-actions";
import { EntryFormDialog } from "./_components/entry-form-dialog";
import { EntryList } from "./_components/entry-list";
import { MonthlySummary } from "./_components/monthly-summary";
import {
  formatAgorotToShekels,
  getHebrewMonthName,
} from "@/lib/calculations/contractor-payroll";
import { Button } from "@/components/ui/button";

export default async function ContractorDashboardPage() {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    redirect("/employee/login");
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [entries, summary, workerNameSuggestions] = await Promise.all([
    getContractorMonthlyEntries(currentYear, currentMonth),
    getContractorMonthlySummary(currentYear, currentMonth),
    getWorkerNameSuggestions(),
  ]);

  const monthLabel = `${getHebrewMonthName(currentMonth)} ${currentYear}`;
  const hourlyRateDisplay = formatAgorotToShekels(
    auth.contractor.baseHourlyRate
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            שלום, {auth.contractor.fullName}
          </h1>
          <p className="text-muted-foreground">
            {monthLabel}
          </p>
        </div>
        <EntryFormDialog
          mode="create"
          workerNameSuggestions={workerNameSuggestions}
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף רשומה
            </Button>
          }
        />
      </div>

      {/* Monthly Summary */}
      {summary && (
        <MonthlySummary
          summary={summary}
          monthLabel={monthLabel}
          hourlyRateDisplay={hourlyRateDisplay}
        />
      )}

      {/* Entry List */}
      <EntryList
        entries={entries}
        workerNameSuggestions={workerNameSuggestions}
      />
    </div>
  );
}
