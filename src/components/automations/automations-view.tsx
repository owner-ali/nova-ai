"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Zap, X, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Run = { id: string; status: string; detail: string | null; runAt: string };
type Automation = { id: string; name: string; trigger: string; action: string; enabled: boolean; runs: Run[] };

const TRIGGER_LABELS: Record<string, string> = {
  "task.created": "New task created",
  "reminder.due": "Reminder time reached",
  "note.created": "New note created",
};
const ACTION_LABELS: Record<string, string> = {
  "ai.summarize": "AI generates a summary",
  "notify.user": "Notify the user",
  "ai.extractTasks": "AI extracts tasks",
};

export function AutomationsView({ initialAutomations }: { initialAutomations: Automation[] }) {
  const [automations, setAutomations] = useState(initialAutomations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "task.created", action: "ai.summarize" });

  async function refresh() {
    const res = await fetch("/api/automations");
    const data = await res.json();
    setAutomations(data.automations);
  }

  async function createAutomation() {
    if (!form.name.trim()) return;
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Unable to create automation.");
      return;
    }
    toast.success("Automation created");
    setShowForm(false);
    setForm({ name: "", trigger: "task.created", action: "ai.summarize" });
    refresh();
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    refresh();
  }

  const activeCount = automations.filter((a) => a.enabled).length;
  const allRuns = automations.flatMap((a) => a.runs.map((r) => ({ ...r, automationName: a.name })));
  const success = allRuns.filter((r) => r.status === "success").length;
  const failed = allRuns.filter((r) => r.status === "failed").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-nova-green" />
          <h1 className="font-display text-2xl font-semibold">Automations</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary self-start"><Plus className="h-4 w-4" /> New automation</button>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center"><p className="font-display text-xl font-semibold">{activeCount}</p><p className="mt-1 text-xs text-white/45">Active</p></div>
        <div className="glass p-4 text-center"><p className="font-display text-xl font-semibold text-nova-green">{success}</p><p className="mt-1 text-xs text-white/45">Successful runs</p></div>
        <div className="glass p-4 text-center"><p className="font-display text-xl font-semibold text-red-400">{failed}</p><p className="mt-1 text-xs text-white/45">Failed runs</p></div>
      </div>

      <div className="space-y-3">
        {automations.map((a) => (
          <div key={a.id} className="glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="mt-1 text-xs text-white/45">
                  When <span className="text-white/70">{TRIGGER_LABELS[a.trigger]}</span> → <span className="text-white/70">{ACTION_LABELS[a.action]}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => toggle(a.id, !a.enabled)}
                  className={cn("h-5 w-9 rounded-full p-0.5 transition-colors", a.enabled ? "bg-nova-green" : "bg-white/15")}
                >
                  <span className={cn("block h-4 w-4 rounded-full bg-white transition-transform", a.enabled && "translate-x-4")} />
                </button>
                <button onClick={() => remove(a.id)} className="text-white/40 hover:text-red-400"><X className="h-4 w-4" /></button>
              </div>
            </div>

            {a.runs.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-line pt-3">
                {a.runs.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs text-white/45">
                    {r.status === "success" ? <CheckCircle2 className="h-3 w-3 text-nova-green" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    <span className="truncate">{r.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {automations.length === 0 && <p className="py-16 text-center text-sm text-white/35">No automations yet.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowForm(false)}>
          <div className="glass w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">New automation</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-white/40" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Automation name" className="input-field" />
              <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="input-field">
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="input-field">
                {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={createAutomation} className="btn-primary w-full">Create automation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
