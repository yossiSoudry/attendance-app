// app/platform/_actions/organization-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminSession, hashPlatformPassword } from "@/lib/platform-auth";
import type { OrganizationStatus, OrganizationPlan } from "@prisma/client";

// ========================================
// Types
// ========================================

export type OrganizationWithStats = {
  id: string;
  name: string;
  email: string;
  legalName: string | null;
  taxId: string | null;
  logoUrl: string | null;
  status: OrganizationStatus;
  plan: OrganizationPlan;
  trialEndsAt: Date | null;
  createdAt: Date;
  _count: {
    employees: number;
    admins: number;
  };
};

// ========================================
// Get Organizations
// ========================================

export async function getOrganizations(): Promise<OrganizationWithStats[]> {
  await requirePlatformAdminSession();

  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          employees: true,
          admins: true,
        },
      },
    },
  });
}

export async function getOrganization(id: string) {
  await requirePlatformAdminSession();

  return prisma.organization.findUnique({
    where: { id },
    include: {
      admins: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          employees: true,
          admins: true,
          departments: true,
          shifts: true,
        },
      },
    },
  });
}

// ========================================
// Create Organization
// ========================================

export async function createOrganization(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  organizationId?: string;
}> {
  await requirePlatformAdminSession();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const legalName = formData.get("legalName") as string | null;
  const taxId = formData.get("taxId") as string | null;
  const plan = (formData.get("plan") as OrganizationPlan) || "FREE";

  // Admin details for first admin
  const adminName = formData.get("adminName") as string;
  const adminEmail = formData.get("adminEmail") as string;
  const adminPassword = formData.get("adminPassword") as string;

  // Validation
  if (!name || !email) {
    return { success: false, error: "נא למלא שם ואימייל של הארגון" };
  }

  if (!adminName || !adminEmail || !adminPassword) {
    return { success: false, error: "נא למלא פרטי מנהל ראשי" };
  }

  if (adminPassword.length < 8) {
    return { success: false, error: "סיסמת המנהל חייבת להכיל לפחות 8 תווים" };
  }

  // Check if organization email exists
  const existingOrg = await prisma.organization.findUnique({
    where: { email },
  });

  if (existingOrg) {
    return { success: false, error: "ארגון עם אימייל זה כבר קיים" };
  }

  // Check if admin email exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    return { success: false, error: "מנהל עם אימייל זה כבר קיים" };
  }

  try {
    const { hashPassword } = await import("@/lib/auth");
    const hashedPassword = await hashPassword(adminPassword);

    // Create organization with first admin
    const organization = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name,
          email,
          legalName: legalName || null,
          taxId: taxId || null,
          plan,
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
      });

      // Create first admin (OWNER)
      await tx.adminUser.create({
        data: {
          organizationId: org.id,
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      // Create default work rules for organization
      await tx.organizationWorkRules.create({
        data: {
          organizationId: org.id,
        },
      });

      // Create default work type
      await tx.workType.create({
        data: {
          organizationId: org.id,
          name: "עבודה רגילה",
          description: "סוג עבודה ברירת מחדל",
          isDefault: true,
        },
      });

      return org;
    });

    revalidatePath("/platform");
    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: "שגיאה ביצירת הארגון" };
  }
}

// ========================================
// Update Organization
// ========================================

export async function updateOrganization(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdminSession();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const legalName = formData.get("legalName") as string | null;
  const taxId = formData.get("taxId") as string | null;
  const status = formData.get("status") as OrganizationStatus;
  const plan = formData.get("plan") as OrganizationPlan;

  if (!name || !email) {
    return { success: false, error: "נא למלא שם ואימייל" };
  }

  // Check email uniqueness (excluding current org)
  const existingOrg = await prisma.organization.findFirst({
    where: {
      email,
      NOT: { id },
    },
  });

  if (existingOrg) {
    return { success: false, error: "ארגון עם אימייל זה כבר קיים" };
  }

  try {
    await prisma.organization.update({
      where: { id },
      data: {
        name,
        email,
        legalName: legalName || null,
        taxId: taxId || null,
        status,
        plan,
      },
    });

    revalidatePath("/platform");
    revalidatePath(`/platform/organizations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: "שגיאה בעדכון הארגון" };
  }
}

// ========================================
// Delete Organization
// ========================================

export async function deleteOrganization(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdminSession();

  try {
    await prisma.organization.delete({
      where: { id },
    });

    revalidatePath("/platform");
    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { success: false, error: "שגיאה במחיקת הארגון" };
  }
}

// ========================================
// Get Platform Stats
// ========================================

export async function getPlatformStats() {
  await requirePlatformAdminSession();

  const [
    totalOrganizations,
    activeOrganizations,
    totalEmployees,
    totalAdmins,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count(),
    prisma.adminUser.count(),
  ]);

  return {
    totalOrganizations,
    activeOrganizations,
    totalEmployees,
    totalAdmins,
  };
}
