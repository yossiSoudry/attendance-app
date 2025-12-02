// types/prisma.ts
// Local type definitions mirroring Prisma schema enums
// This file provides type safety when @prisma/client types are not generated

export type EmployeeStatus = "ACTIVE" | "BLOCKED";

export type ShiftStatus =
  | "OPEN"
  | "CLOSED"
  | "PENDING_APPROVAL"
  | "CORRECTED"
  | "REJECTED";

export type TimeEventType =
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "CORRECTION_IN"
  | "CORRECTION_OUT";

export type ActorType = "EMPLOYEE" | "MANAGER" | "SYSTEM";

export type CalendarEventType =
  | "HOLIDAY"
  | "FAST"
  | "ROSH_CHODESH"
  | "MEMORIAL"
  | "CUSTOM";

export type BonusType = "HOURLY" | "ONE_TIME";

export type TaskStatus = "OPEN" | "COMPLETED" | "POSTPONED" | "CANCELED";

export type Visibility = "EMPLOYER_ONLY" | "EMPLOYEE_CAN_SEE";

export type UploadedBy = "EMPLOYEE" | "MANAGER";

export type Platform = "ANDROID" | "IOS";

export type EmploymentType = "HOURLY" | "MONTHLY";

export type TravelAllowanceType = "NONE" | "DAILY" | "MONTHLY";

export type LeaveType = "VACATION" | "SICK";

export type LeaveStatus = "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";

// Base model types
export type Employee = {
  id: string;
  employeeNumber: number;
  fullName: string;
  nationalId: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  baseHourlyRate: number;
  monthlyRate: number | null;
  workDaysPerWeek: number;
  travelAllowanceType: TravelAllowanceType;
  travelAllowanceAmount: number | null;
  requireLocation: boolean;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkType = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Shift = {
  id: string;
  employeeId: string;
  workTypeId: string | null;
  startTime: Date;
  endTime: Date | null;
  status: ShiftStatus;
  source: string;
  isManual: boolean;
  notesEmployee: string | null;
  notesManager: string | null;
  isRetro: boolean;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeeBonus = {
  id: string;
  employeeId: string;
  bonusType: BonusType;
  amountPerHour: number | null;
  amountFixed: number | null;
  validFrom: Date | null;
  validTo: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeeWorkRate = {
  id: string;
  employeeId: string;
  workTypeId: string;
  hourlyRate: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  approvedDays: number | null;
  approvedById: string | null;
  approvedAt: Date | null;
  employeeNote: string | null;
  managerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};
