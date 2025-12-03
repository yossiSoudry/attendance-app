// app/platform/setup/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "./setup-form";

// Force dynamic rendering - this page checks database state
export const dynamic = "force-dynamic";

export default async function PlatformSetupPage() {
  // Check if platform admin already exists
  const existingAdmin = await prisma.platformAdmin.count();

  if (existingAdmin > 0) {
    // Setup already completed, redirect to login
    redirect("/platform/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4" dir="rtl">
      <SetupForm />
    </div>
  );
}
