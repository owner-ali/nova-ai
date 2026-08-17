"use client";

import { useState } from "react";
import { Search, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConversationSummary = { id: string; title: string; updatedAt: string };

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-line">
      <div className="space-y-3 p-4">
        <button onClick={onNew} className="btn-primary w-full">
          <Plus className="h-4 w-4" /> New conversation
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="input-field pl-9 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className={cn(
              "group flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm",
              activeId === c.id ? "bg-white/[0.07]" : "hover:bg-white/[0.03]"
            )}
          >
            {editingId === c.id ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="input-field flex-1 py-1 text-xs"
                />
                <button onClick={() => { onRename(c.id, editValue); setEditingId(null); }} className="p-1 text-nova-green">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1 text-white/40">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onSelect(c.id)} className="flex-1 truncate text-left text-white/80">
                  {c.title}
                </button>
                <button
                  onClick={() => { setEditingId(c.id); setEditValue(c.title); }}
                  className="hidden p-1 text-white/40 hover:text-white group-hover:block"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(c.id)} className="hidden p-1 text-white/40 hover:text-red-400 group-hover:block">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="px-3 py-6 text-center text-xs text-white/35">No conversations found.</p>}
      </div>
    </div>
  );
}
