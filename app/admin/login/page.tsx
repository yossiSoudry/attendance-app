// app/admin/login/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // If already logged in, redirect to admin dashboard
  if (session?.user) {
    redirect("/admin");
  }

  const errorMessages: Record<string, string> = {
    NotInvited: "אין לך הרשאה להיכנס למערכת. פנה למנהל לקבלת הזמנה.",
    InvitationUsed: "ההזמנה כבר נוצלה.",
    InvitationExpired: "ההזמנה פגה תוקף. בקש הזמנה חדשה.",
    CredentialsSignin: "אימייל או סיסמה שגויים.",
    Default: "אירעה שגיאה בהתחברות. נסה שוב.",
  };

  const errorMessage = params.error
    ? errorMessages[params.error] || errorMessages.Default
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">כניסת מנהלים</h1>
          <p className="mt-2 text-muted-foreground">
            התחבר למערכת הנוכחות
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <LoginForm callbackUrl={params.callbackUrl} />
      </div>
    </div>
  );
}
