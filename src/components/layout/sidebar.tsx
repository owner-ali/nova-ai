"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  CalendarDays,
  NotebookPen,
  Brain,
  FileText,
  Zap,
  Timer,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/memories", label: "Memory", icon: Brain },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-base-900/60 p-4 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nova-btn">
          <Sparkles className="h-4 w-4 text-base-950" />
        </div>
        <span className="font-display text-base font-semibold">Nova AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/[0.06] text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white/85"
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-nova-green")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-white/40">Owner</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md p-1.5 text-white/50 hover:bg-white/[0.06] hover:text-white"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
