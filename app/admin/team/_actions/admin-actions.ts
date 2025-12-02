"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, canManageAdmins, hashPassword, requireOrganizationId } from "@/lib/auth";
import { inviteAdminSchema, registerSchema } from "@/lib/validations/admin-auth";
import { nanoid } from "nanoid";
import type { AdminRole } from "@prisma/client";

// =====================
// Get all admins
// =====================
export async function getAdmins() {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    throw new Error("אין לך הרשאה לצפות ברשימת המנהלים");
  }

  const admins = await prisma.adminUser.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      googleId: true,
      image: true,
      invitedAt: true,
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      createdAt: true,
    },
    orderBy: [
      { role: "asc" }, // OWNER first
      { createdAt: "asc" },
    ],
  });

  return admins;
}

// =====================
// Get pending invitations
// =====================
export async function getPendingInvitations() {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    throw new Error("אין לך הרשאה לצפות בהזמנות");
  }

  const invitations = await prisma.adminInvitation.findMany({
    where: {
      organizationId,
      usedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invitations;
}

// =====================
// Invite a new admin
// =====================
export async function inviteAdmin(input: unknown) {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    return {
      success: false,
      message: "אין לך הרשאה להזמין מנהלים",
    };
  }

  const validation = inviteAdminSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, role, departmentId } = validation.data;

  // Only OWNER can create ADMIN
  if (role === "ADMIN" && session.user.role !== "OWNER") {
    return {
      success: false,
      message: "רק בעל המערכת יכול להזמין מנהלים מלאים",
    };
  }

  // Check if email already exists as admin in this organization
  const existingAdmin = await prisma.adminUser.findFirst({
    where: {
      email,
      organizationId,
    },
  });

  if (existingAdmin) {
    return {
      success: false,
      message: "כתובת האימייל כבר רשומה במערכת",
    };
  }

  // Check if invitation already exists in this organization
  const existingInvitation = await prisma.adminInvitation.findFirst({
    where: {
      email,
      organizationId,
    },
  });

  if (existingInvitation && !existingInvitation.usedAt) {
    // Delete old invitation and create new one
    await prisma.adminInvitation.delete({
      where: { id: existingInvitation.id },
    });
  }

  // Generate invitation token
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Create invitation
  const invitation = await prisma.adminInvitation.create({
    data: {
      email,
      role: role as AdminRole,
      departmentId: departmentId || null,
      token,
      expiresAt,
      invitedById: session.user.id,
      organizationId,
    },
  });

  revalidatePath("/admin/team");

  // Return the invitation link
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/register?token=${token}`;

  return {
    success: true,
    message: "ההזמנה נוצרה בהצלחה",
    inviteLink,
    invitation,
  };
}

// =====================
// Register from invitation (email/password)
// =====================
export async function registerFromInvitation(input: unknown) {
  const validation = registerSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password, name, invitationToken } = validation.data;

  // Find invitation
  const invitation = await prisma.adminInvitation.findUnique({
    where: { token: invitationToken },
  });

  if (!invitation) {
    return {
      success: false,
      message: "הזמנה לא נמצאה",
    };
  }

  if (invitation.usedAt) {
    return {
      success: false,
      message: "ההזמנה כבר נוצלה",
    };
  }

  if (invitation.expiresAt < new Date()) {
    return {
      success: false,
      message: "ההזמנה פגה תוקף",
    };
  }

  if (invitation.email !== email) {
    return {
      success: false,
      message: "כתובת האימייל לא תואמת להזמנה",
    };
  }

  // Check if email already exists in the invitation's organization
  const existingAdmin = await prisma.adminUser.findFirst({
    where: {
      email,
      organizationId: invitation.organizationId,
    },
  });

  if (existingAdmin) {
    return {
      success: false,
      message: "כתובת האימייל כבר רשומה במערכת",
    };
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create admin and mark invitation as used
  await prisma.$transaction(async (tx) => {
    await tx.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: invitation.role,
        departmentId: invitation.departmentId,
        invitedById: invitation.invitedById,
        invitedAt: new Date(),
        organizationId: invitation.organizationId,
      },
    });

    await tx.adminInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });
  });

  return {
    success: true,
    message: "ההרשמה בוצעה בהצלחה! כעת ניתן להתחבר",
  };
}

// =====================
// Update admin role
// =====================
export async function updateAdminRole(adminId: string, newRole: AdminRole) {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  // Only OWNER can change roles
  if (session.user.role !== "OWNER") {
    return {
      success: false,
      message: "רק בעל המערכת יכול לשנות תפקידים",
    };
  }

  // Cannot change own role
  if (adminId === session.user.id) {
    return {
      success: false,
      message: "לא ניתן לשנות את התפקיד של עצמך",
    };
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      id: adminId,
      organizationId,
    },
  });

  if (!admin) {
    return {
      success: false,
      message: "המנהל לא נמצא",
    };
  }

  // Cannot demote another OWNER
  if (admin.role === "OWNER") {
    return {
      success: false,
      message: "לא ניתן לשנות את התפקיד של בעל מערכת",
    };
  }

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { role: newRole },
  });

  revalidatePath("/admin/team");

  return {
    success: true,
    message: "התפקיד עודכן בהצלחה",
  };
}

// =====================
// Deactivate admin
// =====================
export async function deactivateAdmin(adminId: string) {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    return {
      success: false,
      message: "אין לך הרשאה לבטל מנהלים",
    };
  }

  // Cannot deactivate self
  if (adminId === session.user.id) {
    return {
      success: false,
      message: "לא ניתן לבטל את עצמך",
    };
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      id: adminId,
      organizationId,
    },
  });

  if (!admin) {
    return {
      success: false,
      message: "המנהל לא נמצא",
    };
  }

  // Cannot deactivate OWNER (unless you're OWNER)
  if (admin.role === "OWNER" && session.user.role !== "OWNER") {
    return {
      success: false,
      message: "רק בעל המערכת יכול לבטל בעל מערכת אחר",
    };
  }

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { status: "INACTIVE" },
  });

  revalidatePath("/admin/team");

  return {
    success: true,
    message: "המנהל בוטל בהצלחה",
  };
}

// =====================
// Reactivate admin
// =====================
export async function reactivateAdmin(adminId: string) {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    return {
      success: false,
      message: "אין לך הרשאה להפעיל מנהלים",
    };
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      id: adminId,
      organizationId,
    },
  });

  if (!admin) {
    return {
      success: false,
      message: "המנהל לא נמצא",
    };
  }

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/admin/team");

  return {
    success: true,
    message: "המנהל הופעל מחדש בהצלחה",
  };
}

// =====================
// Delete invitation
// =====================
export async function deleteInvitation(invitationId: string) {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    return {
      success: false,
      message: "אין לך הרשאה למחוק הזמנות",
    };
  }

  // Verify invitation belongs to this organization
  const invitation = await prisma.adminInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
    },
  });

  if (!invitation) {
    return {
      success: false,
      message: "הזמנה לא נמצאה",
    };
  }

  await prisma.adminInvitation.delete({
    where: { id: invitationId },
  });

  revalidatePath("/admin/team");

  return {
    success: true,
    message: "ההזמנה נמחקה בהצלחה",
  };
}

// =====================
// Get departments
// =====================
export async function getDepartments() {
  const organizationId = await requireOrganizationId();

  const departments = await prisma.department.findMany({
    where: {
      organizationId,
    },
    orderBy: { name: "asc" },
  });

  return departments;
}

// =====================
// Create department
// =====================
export async function createDepartment(name: string, description?: string) {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  if (!canManageAdmins(session.user.role)) {
    return {
      success: false,
      message: "אין לך הרשאה ליצור מחלקות",
    };
  }

  const existingDepartment = await prisma.department.findFirst({
    where: {
      name,
      organizationId,
    },
  });

  if (existingDepartment) {
    return {
      success: false,
      message: "מחלקה עם שם זה כבר קיימת",
    };
  }

  const department = await prisma.department.create({
    data: {
      name,
      description,
      organizationId,
    },
  });

  revalidatePath("/admin/team");

  return {
    success: true,
    message: "המחלקה נוצרה בהצלחה",
    department,
  };
}
