// app/admin/leave/_components/leave-admin-content.tsx
"use client";

import * as React from "react";
import { CalendarDays, Filter, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  getAllLeaveRequests,
  getPendingLeaveRequests,
  type LeaveRequestForAdmin,
} from "../_actions/leave-admin-actions";
import { LeaveRequestCard } from "./leave-request-card";

type LeaveAdminContentProps = {
  initialPending: LeaveRequestForAdmin[];
  employees: { id: string; fullName: string }[];
};

const statusConfig = {
  PENDING: { label: "ממתין", color: "bg-amber-500" },
  APPROVED: { label: "אושר", color: "bg-emerald-500" },
  PARTIALLY_APPROVED: { label: "אושר חלקית", color: "bg-blue-500" },
  REJECTED: { label: "נדחה", color: "bg-red-500" },
};

export function LeaveAdminContent({
  initialPending,
  employees,
}: LeaveAdminContentProps) {
  const [pendingRequests, setPendingRequests] =
    React.useState<LeaveRequestForAdmin[]>(initialPending);
  const [allRequests, setAllRequests] = React.useState<LeaveRequestForAdmin[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("pending");

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [employeeFilter, setEmployeeFilter] = React.useState("all");

  async function refreshPending() {
    setIsLoading(true);
    const data = await getPendingLeaveRequests();
    setPendingRequests(data);
    setIsLoading(false);
  }

  async function loadAllRequests() {
    setIsLoading(true);
    const data = await getAllLeaveRequests({
      status: statusFilter,
      employeeId: employeeFilter,
    });
    setAllRequests(data);
    setIsLoading(false);
  }

  React.useEffect(() => {
    if (activeTab === "all") {
      loadAllRequests();
    }
  }, [activeTab, statusFilter, employeeFilter]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="pending" className="gap-2">
          ממתינות לאישור
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5">
              {pendingRequests.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="all">כל הבקשות</TabsTrigger>
      </TabsList>

      {/* Pending Tab */}
      <TabsContent value="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">בקשות ממתינות לאישור</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPending}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">אין בקשות ממתינות</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                onAction={refreshPending}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* All Requests Tab */}
      <TabsContent value="all" className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">סינון:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="PENDING">ממתין</SelectItem>
              <SelectItem value="APPROVED">אושר</SelectItem>
              <SelectItem value="PARTIALLY_APPROVED">אושר חלקית</SelectItem>
              <SelectItem value="REJECTED">נדחה</SelectItem>
            </SelectContent>
          </Select>

          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="עובד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העובדים</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAllRequests}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : allRequests.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">לא נמצאו בקשות</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allRequests.map((request) => (
              <LeaveRequestRow key={request.id} request={request} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Simple row component for "all requests" view
function LeaveRequestRow({ request }: { request: LeaveRequestForAdmin }) {
  const status = statusConfig[request.status];

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-4">
        <div className={`h-2 w-2 rounded-full ${status.color}`} />
        <div>
          <div className="font-medium">{request.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {request.leaveType === "VACATION" ? "חופשה" : "מחלה"} -{" "}
            {request.totalDays} ימים
          </div>
        </div>
      </div>
      <div className="text-left">
        <div className="text-sm">{status.label}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(request.startDate).toLocaleDateString("he-IL")} -{" "}
          {new Date(request.endDate).toLocaleDateString("he-IL")}
        </div>
      </div>
    </div>
  );
}
