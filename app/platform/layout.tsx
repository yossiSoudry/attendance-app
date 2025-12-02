// app/platform/layout.tsx
import { redirect } from "next/navigation";
import { getPlatformAdminSession } from "@/lib/platform-auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if this is the login page - don't require auth
  // The login page will handle its own layout
  return <>{children}</>;
}
