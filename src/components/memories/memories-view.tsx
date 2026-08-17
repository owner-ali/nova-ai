"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil, Check, X, Brain } from "lucide-react";

type Memory = { id: string; content: string; category: string; importance: number };

export function MemoriesView({ initialMemories }: { initialMemories: Memory[] }) {
  const [memories, setMemories] = useState(initialMemories);
  const [query, setQuery] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function refresh() {
    const res = await fetch("/api/memories");
    const data = await res.json();
    setMemories(data.memories);
  }

  async function addMemory() {
    if (!newContent.trim()) return;
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    if (!res.ok) {
      toast.error("Unable to save memory.");
      return;
    }
    setNewContent("");
    toast.success("Nova will remember that.");
    refresh();
  }

  async function saveEdit(id: string) {
    await fetch(`/api/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editValue }),
    });
    setEditingId(null);
    refresh();
  }

  async function deleteMemory(id: string) {
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    toast.success("Memory deleted");
    refresh();
  }

  const filtered = memories.filter((m) => m.content.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <header className="mb-2 flex items-center gap-2">
        <Brain className="h-5 w-5 text-nova-purple" />
        <h1 className="font-display text-2xl font-semibold">Memory</h1>
      </header>
      <p className="mb-6 text-sm text-white/45">
        What Nova remembers about you. Only visible to you, and only used in your own conversations.
      </p>

      <div className="glass mb-6 flex items-center gap-2 p-3">
        <input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMemory()}
          placeholder='e.g. "I prefer dark themes"'
          className="input-field flex-1 border-none bg-transparent"
        />
        <button onClick={addMemory} className="btn-primary shrink-0 px-3 py-2">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memories" className="input-field pl-9" />
      </div>

      <div className="space-y-2.5">
        {filtered.map((m) => (
          <div key={m.id} className="glass flex items-start justify-between gap-3 p-4">
            {editingId === m.id ? (
              <>
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="input-field flex-1" autoFocus />
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => saveEdit(m.id)} className="p-1.5 text-nova-green"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-white/40"><X className="h-4 w-4" /></button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-white/85">{m.content}</p>
                  <span className="mt-1 inline-block rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{m.category}</span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => { setEditingId(m.id); setEditValue(m.content); }} className="p-1.5 text-white/40 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteMemory(m.id)} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="py-16 text-center text-sm text-white/35">Nothing saved yet.</p>}
      </div>
    </div>
  );
}
