// app/platform/_actions/platform-auth-actions.ts
"use server";

import { redirect } from "next/navigation";
import {
  signInPlatformAdmin,
  signOutPlatformAdmin,
  createInitialPlatformAdmin,
} from "@/lib/platform-auth";

export async function loginPlatformAdmin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "נא להזין אימייל וסיסמה" };
  }

  return signInPlatformAdmin(email, password);
}

export async function logoutPlatformAdmin(): Promise<void> {
  await signOutPlatformAdmin();
  redirect("/platform/login");
}

export async function setupPlatformAdmin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { success: false, error: "נא למלא את כל השדות" };
  }

  if (password.length < 8) {
    return { success: false, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  return createInitialPlatformAdmin(email, password, name);
}
