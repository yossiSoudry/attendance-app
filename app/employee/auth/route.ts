// app/employee/auth/route.ts
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const nationalId = formData.get("nationalId")?.toString().trim();

  if (!nationalId) {
    redirect("/employee/login?error=" + encodeURIComponent("יש להזין תעודת זהות"));
  }

  const employee = await prisma.employee.findUnique({
    where: { nationalId },
  });

  if (!employee) {
    redirect("/employee/login?error=" + encodeURIComponent("תעודת זהות לא נמצאה במערכת"));
  }

  if (employee.status === "BLOCKED") {
    redirect("/employee/login?error=" + encodeURIComponent("החשבון שלך חסום. פנה למנהל המערכת"));
  }

  const cookieStore = await cookies();
  cookieStore.set("employeeId", employee.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/employee");
}