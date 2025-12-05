// app/platform/_actions/platform-settings-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminSession } from "@/lib/platform-auth";

// ========================================
// Types
// ========================================

export type PlatformSettingsData = {
  id: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// Get Platform Settings
// ========================================

export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  // Get or create default settings
  let settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: "default",
        timezone: "Asia/Jerusalem",
      },
    });
  }

  return settings;
}

// ========================================
// Update Platform Settings
// ========================================

export async function updatePlatformSettings(
  data: { timezone: string }
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdminSession();

  try {
    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
    } catch {
      return { success: false, error: "אזור זמן לא חוקי" };
    }

    await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: { timezone: data.timezone },
      create: {
        id: "default",
        timezone: data.timezone,
      },
    });

    revalidatePath("/platform/settings");
    revalidatePath("/admin");
    revalidatePath("/employee");

    return { success: true };
  } catch (error) {
    console.error("Failed to update platform settings:", error);
    return { success: false, error: "שגיאה בעדכון ההגדרות" };
  }
}
