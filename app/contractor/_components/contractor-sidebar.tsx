// app/contractor/_components/contractor-sidebar.tsx
"use client";

import {
  Building2,
  ChevronsUpDown,
  Download,
  History,
  Home,
  LogOut,
  Plus,
  Share,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { OrganizationInfo } from "./contractor-layout-wrapper";

// ========================================
// Types
// ========================================

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type ContractorSidebarProps = {
  contractorName: string;
  organization: OrganizationInfo;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Get initials from name
function getInitials(name: string | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ========================================
// Component
// ========================================

export function ContractorSidebar({
  contractorName,
  organization,
}: ContractorSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navMain: NavItem[] = [
    {
      title: "הזנת שעות",
      url: "/contractor",
      icon: Plus,
    },
    {
      title: "היסטוריה",
      url: "/contractor/history",
      icon: History,
    },
  ];

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/contractor">
                {organization?.logoUrl ? (
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={organization.logoUrl}
                      alt={organization.name}
                    />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      <Building2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="h-4 w-4" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold truncate max-w-[140px]">
                    {organization?.name || "ממשק קבלן"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    מנהל כוח אדם
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניווט</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Install App Button - Android/Desktop */}
        {!isInstalled && deferredPrompt && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="התקן כאפליקציה"
                    onClick={handleInstallClick}
                    className="text-primary"
                  >
                    <Download className="h-4 w-4" />
                    <span>התקן כאפליקציה</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Install App Button - iOS */}
        {!isInstalled && isIOS && !deferredPrompt && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="התקן כאפליקציה"
                    onClick={() => setShowIOSInstructions(true)}
                    className="text-primary"
                  >
                    <Download className="h-4 w-4" />
                    <span>התקן כאפליקציה</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* iOS Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-lg p-6 max-w-sm w-full shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">התקנת האפליקציה</h3>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <p>להתקנת האפליקציה באייפון:</p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    לחץ על כפתור השיתוף <Share className="h-4 w-4 inline" />
                  </li>
                  <li>גלול ובחר &quot;Add to Home Screen&quot;</li>
                  <li>לחץ &quot;Add&quot; בפינה הימנית העליונה</li>
                </ol>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="mt-4 w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium"
              >
                הבנתי
              </button>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {getInitials(contractorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-right text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {contractorName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      מנהל כוח אדם
                    </span>
                  </div>
                  <ChevronsUpDown className="mr-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-right text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {getInitials(contractorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-right text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {contractorName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {organization?.name || "מנהל כוח אדם"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" onClick={handleNavClick}>
                    <Home className="h-4 w-4" />
                    דף הבית
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="text-destructive focus:text-destructive"
                >
                  <Link href="/employee/login" onClick={handleNavClick}>
                    <LogOut className="h-4 w-4" />
                    יציאה
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
