// lib/audit-utils.ts
// Centralized audit logging utilities

import { prisma } from "@/lib/prisma";
import type { ActorType } from "@prisma/client";
import { Prisma } from "@prisma/client";

type AuditLogParams = {
  organizationId: string;
  actorType: ActorType;
  actorId?: string;
  entity: string;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  organizationId,
  actorType,
  actorId,
  entity,
  entityId,
  action,
  before,
  after,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorType,
        actorId: actorId || null,
        entity,
        entityId,
        action,
        before: before ?? Prisma.JsonNull,
        after: after ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Create audit log for manager actions
 */
export async function auditManagerAction(
  organizationId: string,
  entity: string,
  entityId: string,
  action: string,
  after?: Prisma.InputJsonValue,
  before?: Prisma.InputJsonValue
): Promise<void> {
  await createAuditLog({
    organizationId,
    actorType: "MANAGER",
    entity,
    entityId,
    action,
    before,
    after,
  });
}

/**
 * Create audit log for employee actions
 */
export async function auditEmployeeAction(
  organizationId: string,
  employeeId: string,
  entity: string,
  entityId: string,
  action: string,
  after?: Prisma.InputJsonValue,
  before?: Prisma.InputJsonValue
): Promise<void> {
  await createAuditLog({
    organizationId,
    actorType: "EMPLOYEE",
    actorId: employeeId,
    entity,
    entityId,
    action,
    before,
    after,
  });
}

/**
 * Create audit log for system actions
 */
export async function auditSystemAction(
  organizationId: string,
  entity: string,
  entityId: string,
  action: string,
  after?: Prisma.InputJsonValue
): Promise<void> {
  await createAuditLog({
    organizationId,
    actorType: "SYSTEM",
    entity,
    entityId,
    action,
    after,
  });
}
