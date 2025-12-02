// app/platform/_components/platform-navbar.tsx
"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function PlatformNavbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-mr-1" />
        <Separator
          orientation="vertical"
          className="ml-2 data-[orientation=vertical]:h-4"
        />
        <span className="text-sm font-medium text-muted-foreground">
          ממשק בעל הפלטפורמה
        </span>
      </div>

      <div className="flex items-center gap-2 px-4">
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}
