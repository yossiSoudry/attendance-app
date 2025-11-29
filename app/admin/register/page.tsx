// app/admin/register/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./_components/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // If already logged in, redirect to admin dashboard
  if (session?.user) {
    redirect("/admin");
  }

  const token = params.token;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">קישור לא תקין</h1>
          <p className="text-muted-foreground">
            חסר קוד הזמנה. בקש קישור חדש מהמנהל.
          </p>
        </div>
      </div>
    );
  }

  // Verify invitation
  const invitation = await prisma.adminInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">הזמנה לא נמצאה</h1>
          <p className="text-muted-foreground">
            ההזמנה לא קיימת או נמחקה. בקש קישור חדש מהמנהל.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.usedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">הזמנה כבר נוצלה</h1>
          <p className="text-muted-foreground">
            ההזמנה כבר שומשה להרשמה. אם זה לא אתה, פנה למנהל.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">הזמנה פגה תוקף</h1>
          <p className="text-muted-foreground">
            ההזמנה כבר לא תקפה. בקש קישור חדש מהמנהל.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">הרשמה למערכת</h1>
          <p className="mt-2 text-muted-foreground">
            הוזמנת להצטרף כמנהל במערכת הנוכחות
          </p>
        </div>

        <RegisterForm
          email={invitation.email}
          token={token}
        />
      </div>
    </div>
  );
}
