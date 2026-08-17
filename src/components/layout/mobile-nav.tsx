"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, CheckSquare, CalendarDays, Menu, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/assistant", label: "AI", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "More", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/assistant"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-nova-btn shadow-glow lg:hidden"
        aria-label="Open voice assistant"
      >
        <Mic className="h-6 w-6 text-base-950" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-base-900/90 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  active ? "text-nova-green" : "text-white/50"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
