// app/platform/(authenticated)/layout.tsx
import { redirect } from "next/navigation";
import { getPlatformAdminSession } from "@/lib/platform-auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PlatformSidebar } from "../_components/platform-sidebar";
import { PlatformNavbar } from "../_components/platform-navbar";

export default async function AuthenticatedPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPlatformAdminSession();

  if (!session) {
    redirect("/platform/login");
  }

  return (
    <SidebarProvider>
      <PlatformSidebar admin={session} />
      <SidebarInset>
        <PlatformNavbar />
        <main className="flex-1 p-4 md:p-6" dir="rtl">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
