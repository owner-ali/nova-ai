"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil, Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskForm, type TaskFormValues } from "./task-form";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
  category?: string | null;
};

const STATUS_COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
];

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-white/10 text-white/60",
  MEDIUM: "bg-nova-blue/15 text-nova-blue",
  HIGH: "bg-nova-purple/20 text-nova-purple",
  URGENT: "bg-red-500/20 text-red-400",
};

export function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  async function refresh() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks);
  }

  async function createTask(values: TaskFormValues) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      }),
    });
    if (!res.ok) {
      toast.error("Unable to create task.");
      return;
    }
    toast.success("Task created");
    setShowForm(false);
    refresh();
  }

  async function updateTask(id: string, values: Partial<TaskFormValues & { status: Task["status"] }>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      }),
    });
    if (!res.ok) {
      toast.error("Unable to update task.");
      return;
    }
    setEditingTask(null);
    refresh();
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Unable to delete task.");
      return;
    }
    toast.success("Task deleted");
    refresh();
  }

  const filtered = tasks.filter((t) => {
    const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchesQuery && matchesPriority;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <p className="mt-1 text-sm text-white/45">{tasks.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary self-start">
          <Plus className="h-4 w-4" /> New task
        </button>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" className="input-field pl-9" />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field appearance-none pl-9 pr-8">
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATUS_COLUMNS.map((col) => {
          const items = filtered.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="glass p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">{col.label}</h2>
                <span className="text-xs text-white/35">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((t) => (
                  <div key={t.id} className="group rounded-lg border border-line bg-white/[0.02] p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium", t.status === "COMPLETED" && "text-white/40 line-through")}>{t.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                    </div>
                    {t.description && <p className="mt-1.5 text-xs text-white/45">{t.description}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1.5 text-[11px] text-white/35">
                        {t.category && <span className="rounded bg-white/5 px-1.5 py-0.5">{t.category}</span>}
                        {t.dueDate && <span>{new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {col.key !== "COMPLETED" && (
                          <button onClick={() => updateTask(t.id, { status: "COMPLETED" })} className="rounded p-1 text-white/40 hover:text-nova-green" title="Mark complete">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => setEditingTask(t)} className="rounded p-1 text-white/40 hover:text-white" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteTask(t.id)} className="rounded p-1 text-white/40 hover:text-red-400" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-white/30">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <TaskForm onSubmit={createTask} onClose={() => setShowForm(false)} />}
      {editingTask && (
        <TaskForm
          initial={{
            title: editingTask.title,
            description: editingTask.description ?? "",
            priority: editingTask.priority,
            category: editingTask.category ?? "",
            dueDate: editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : "",
          }}
          onSubmit={(values) => updateTask(editingTask.id, values)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
