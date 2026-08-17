import Link from "next/link";
import { Mic, Sparkles, CheckCircle2, CalendarClock, Brain } from "lucide-react";

const FEATURES = [
  { icon: Mic, title: "Voice-first", desc: "Talk to Nova like a real assistant — tap, speak, and it's handled." },
  { icon: CheckCircle2, title: "Tasks & reminders", desc: "Create, prioritize, and track everything from plain language." },
  { icon: CalendarClock, title: "Calendar built in", desc: "Schedule meetings and see your day without leaving the chat." },
  { icon: Brain, title: "Remembers you", desc: "Nova learns your preferences and context over time — securely, per-user." },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nova-btn">
            <Sparkles className="h-4 w-4 text-base-950" />
          </div>
          <span className="font-display text-lg font-semibold">Nova AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Sign in</Link>
          <Link href="/register" className="btn-primary">Get started</Link>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <span className="label-eyebrow mb-5 rounded-full border border-line px-3 py-1">Personal AI assistant</span>
        <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          Your AI assistant that{" "}
          <span className="bg-nova-btn bg-clip-text text-transparent">gets things done.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base text-white/60 sm:text-lg">
          Nova manages your tasks, reminders, calendar, and notes — by text or by voice —
          and remembers what matters to you.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-7 py-3 text-base">Start free</Link>
          <Link href="/login" className="btn-secondary px-7 py-3 text-base">I have an account</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass glass-hover p-6">
            <f.icon className="mb-4 h-5 w-5 text-nova-green" />
            <h3 className="font-display text-sm font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-white/55">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
