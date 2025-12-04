// app/platform/_actions/platform-admin-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminSession } from "@/lib/platform-auth";

// Get all platform admins
export async function getPlatformAdmins() {
  await requirePlatformAdminSession();

  const admins = await prisma.platformAdmin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return admins;
}

// Create a new platform admin
export async function createPlatformAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdminSession();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { success: false, error: "נא למלא את כל השדות" };
  }

  if (password.length < 8) {
    return { success: false, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  // Check if email already exists
  const existing = await prisma.platformAdmin.findUnique({
    where: { email },
  });

  if (existing) {
    return { success: false, error: "כתובת האימייל כבר קיימת במערכת" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.platformAdmin.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  revalidatePath("/platform/admins");
  return { success: true };
}

// Update platform admin
export async function updatePlatformAdmin(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdminSession();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email || !name) {
    return { success: false, error: "נא למלא את כל השדות" };
  }

  // Check if email already exists for another admin
  const existing = await prisma.platformAdmin.findFirst({
    where: {
      email,
      NOT: { id },
    },
  });

  if (existing) {
    return { success: false, error: "כתובת האימייל כבר קיימת במערכת" };
  }

  const updateData: { email: string; name: string; password?: string } = {
    email,
    name,
  };

  // Only update password if provided
  if (password && password.length > 0) {
    if (password.length < 8) {
      return { success: false, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
    }
    updateData.password = await bcrypt.hash(password, 12);
  }

  await prisma.platformAdmin.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/platform/admins");
  return { success: true };
}

// Delete platform admin
export async function deletePlatformAdmin(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePlatformAdminSession();

  // Prevent deleting yourself
  if (session.id === id) {
    return { success: false, error: "לא ניתן למחוק את עצמך" };
  }

  // Ensure at least one admin remains
  const count = await prisma.platformAdmin.count();
  if (count <= 1) {
    return { success: false, error: "חייב להישאר לפחות מנהל פלטפורמה אחד" };
  }

  await prisma.platformAdmin.delete({
    where: { id },
  });

  revalidatePath("/platform/admins");
  return { success: true };
}
