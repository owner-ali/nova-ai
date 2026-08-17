import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { greetingForHour } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Flame,
  Bot,
  ListTodo,
  BellRing,
  CalendarClock,
  Plus,
  Mic,
  Zap,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;
  const userName = session!.user!.name?.split(" ")[0] ?? "there";

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

  const [tasksToday, tasksCompleted, tasksRemaining, reminders, events, focusSessions, automations] =
    await Promise.all([
      prisma.task.findMany({
        where: { userId, status: { not: "COMPLETED" } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
      }),
      prisma.task.count({ where: { userId, status: "COMPLETED" } }),
      prisma.task.count({ where: { userId, status: { not: "COMPLETED" } } }),
      prisma.reminder.findMany({
        where: { userId, status: "PENDING", reminderTime: { gte: new Date() } },
        orderBy: { reminderTime: "asc" },
        take: 4,
      }),
      prisma.calendarEvent.findMany({
        where: { userId, startTime: { gte: todayStart, lte: todayEnd } },
        orderBy: { startTime: "asc" },
        take: 4,
      }),
      prisma.focusSession.aggregate({
        where: { userId, startedAt: { gte: todayStart } },
        _sum: { durationMin: true },
      }),
      prisma.automation.findMany({ where: { userId } }),
    ]);

  const focusHours = ((focusSessions._sum.durationMin ?? 0) / 60).toFixed(1);
  const topTask = tasksToday[0];
  const activeAutomations = automations.filter((a: any) => a.enabled).length;

  const greeting = `${greetingForHour(new Date().getHours())}, ${userName}`;
  const briefing = tasksToday.length
    ? `You have ${tasksToday.length} task${tasksToday.length === 1 ? "" : "s"} in progress today.${
        topTask ? ` Your highest priority is "${topTask.title}".` : ""
      }`
    : "You're all caught up — no open tasks right now.";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{greeting} 👋</h1>
        <p className="text-sm text-white/45">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} ·{" "}
          {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </header>

      <div className="glass mb-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nova-ai">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="label-eyebrow mb-1">Nova&apos;s briefing</p>
            <p className="text-sm text-white/85 sm:text-base">{briefing}</p>
          </div>
        </div>
        <Link href="/assistant" className="btn-secondary shrink-0">
          Ask Nova <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon={CheckCircle2} label="Tasks completed" value={tasksCompleted} />
        <StatCard icon={ListTodo} label="Tasks remaining" value={tasksRemaining} accent="purple" />
        <StatCard icon={Clock} label="Focus hours today" value={focusHours} />
        <StatCard icon={BellRing} label="Active reminders" value={reminders.length} accent="purple" />
        <StatCard icon={Zap} label="Active automations" value={activeAutomations} />
        <StatCard icon={Flame} label="Productivity streak" value="3 days" accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="glass p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Today&apos;s tasks</h2>
            <Link href="/tasks" className="text-xs text-nova-green hover:underline">View all</Link>
          </div>
          {tasksToday.length === 0 ? (
            <EmptyState text="Nothing on your plate. Ask Nova to add a task." />
          ) : (
            <ul className="space-y-2.5">
              {tasksToday.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    {t.dueDate && (
                      <p className="mt-0.5 text-xs text-white/40">
                        Due {t.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <PriorityBadge priority={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Upcoming reminders</h2>
            <Link href="/tasks" className="text-xs text-nova-green hover:underline">View all</Link>
          </div>
          {reminders.length === 0 ? (
            <EmptyState text="No reminders scheduled." />
          ) : (
            <ul className="space-y-2.5">
              {reminders.map((r: any) => (
                <li key={r.id} className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {r.reminderTime.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Today&apos;s calendar</h2>
            <Link href="/calendar" className="text-xs text-nova-green hover:underline">View all</Link>
          </div>
          {events.length === 0 ? (
            <EmptyState text="No events today." />
          ) : (
            <ul className="space-y-2.5">
              {events.map((e: any) => (
                <li key={e.id} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                  <CalendarClock className="h-4 w-4 shrink-0 text-nova-blue" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-white/40">
                      {e.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass flex flex-col gap-3 p-6">
          <h2 className="font-display mb-1 text-sm font-semibold">Quick actions</h2>
          <QuickAction href="/tasks" icon={Plus} label="Create a task" />
          <QuickAction href="/assistant" icon={Mic} label="Talk to Nova" />
          <QuickAction href="/focus" icon={Clock} label="Start focus session" />
          <QuickAction href="/automations" icon={Zap} label="Manage automations" />
        </section>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-white/35">{text}</p>;
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:bg-white/[0.05]">
      <Icon className="h-4 w-4 text-nova-green" />
      {label}
    </Link>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-white/10 text-white/60",
    MEDIUM: "bg-nova-blue/15 text-nova-blue",
    HIGH: "bg-nova-purple/20 text-nova-purple",
    URGENT: "bg-red-500/20 text-red-400",
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[priority]}`}>{priority}</span>;
}
