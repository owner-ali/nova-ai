"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pin, Trash2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = { id: string; title: string; content: string; pinned: boolean; updatedAt: string };

export function NotesView({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes);
  }

  async function createNote() {
    if (!form.title.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Unable to create note.");
      return;
    }
    toast.success("Note created");
    setShowForm(false);
    setForm({ title: "", content: "" });
    refresh();
  }

  async function togglePin(note: Note) {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    refresh();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setOpenNote(null);
    toast.success("Note deleted");
    refresh();
  }

  async function runAiAction(action: "summarize" | "rewrite" | "extractTasks") {
    if (!openNote) return;
    setAiLoading(true);
    setAiResult(null);
    const res = await fetch(`/api/notes/${openNote.id}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setAiLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "AI action failed.");
      return;
    }
    setAiResult(data.result);
    if (action === "extractTasks") toast.success("Any action items were added to your tasks.");
  }

  const filtered = notes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold">Notes</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary self-start">
          <Plus className="h-4 w-4" /> New note
        </button>
      </header>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="input-field pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((n) => (
          <button key={n.id} onClick={() => setOpenNote(n)} className="glass glass-hover p-5 text-left">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="truncate font-display text-sm font-semibold">{n.title}</h3>
              {n.pinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-nova-green text-nova-green" />}
            </div>
            <p className="line-clamp-4 text-sm text-white/50">{n.content}</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-full py-16 text-center text-sm text-white/35">No notes found.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowForm(false)}>
          <div className="glass w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">New note</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-white/40" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input-field" />
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write something..." rows={8} className="input-field resize-none" />
              <button onClick={createNote} className="btn-primary w-full">Save note</button>
            </div>
          </div>
        </div>
      )}

      {openNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => { setOpenNote(null); setAiResult(null); }}>
          <div className="glass flex max-h-[85vh] w-full max-w-2xl flex-col p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">{openNote.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => togglePin(openNote)} className={cn("p-1.5", openNote.pinned ? "text-nova-green" : "text-white/40")}>
                  <Pin className="h-4 w-4" />
                </button>
                <button onClick={() => deleteNote(openNote.id)} className="p-1.5 text-white/40 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => { setOpenNote(null); setAiResult(null); }}><X className="h-4 w-4 text-white/40" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm text-white/75">{openNote.content}</p>

              {aiResult && (
                <div className="mt-4 rounded-lg border border-nova-purple/30 bg-nova-purple/5 p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-nova-purple"><Sparkles className="h-3 w-3" /> Nova</p>
                  <p className="whitespace-pre-wrap text-sm text-white/80">{aiResult}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <button onClick={() => runAiAction("summarize")} disabled={aiLoading} className="btn-secondary text-xs">Summarize</button>
              <button onClick={() => runAiAction("rewrite")} disabled={aiLoading} className="btn-secondary text-xs">Rewrite</button>
              <button onClick={() => runAiAction("extractTasks")} disabled={aiLoading} className="btn-secondary text-xs">Extract tasks</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
