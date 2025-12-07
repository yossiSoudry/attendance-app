// lib/types/actions.ts
// Shared types for server actions

export type ActionResult<T = void> = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: T;
};

export type ActionSuccess<T = void> = {
  success: true;
  message: string;
  data?: T;
};

export type ActionError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

// Actor types for audit logging
export const ACTOR_TYPE = {
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  SYSTEM: "SYSTEM",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
} as const;

export type ActorType = (typeof ACTOR_TYPE)[keyof typeof ACTOR_TYPE];

// Common entity types for audit logging
export const ENTITY_TYPE = {
  EMPLOYEE: "EMPLOYEE",
  SHIFT: "SHIFT",
  TASK: "TASK",
  LEAVE: "LEAVE",
  BONUS: "BONUS",
  WORK_TYPE: "WORK_TYPE",
  WORK_RATE: "WORK_RATE",
  ADMIN: "ADMIN",
  ORGANIZATION: "ORGANIZATION",
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

// Audit action types
export const AUDIT_ACTION = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  CLOCK_IN: "CLOCK_IN",
  CLOCK_OUT: "CLOCK_OUT",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
