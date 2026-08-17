"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type TaskFormValues = {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category?: string;
  dueDate?: string;
};

export function TaskForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<TaskFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: initial?.priority ?? "MEDIUM",
    category: initial?.category ?? "",
    dueDate: initial?.dueDate ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="glass w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">{initial ? "Edit task" : "New task"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!values.title.trim()) return;
            onSubmit(values);
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Title</label>
            <input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} className="input-field" placeholder="Finish my portfolio" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Description</label>
            <textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} rows={3} className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Priority</label>
              <select value={values.priority} onChange={(e) => setValues({ ...values, priority: e.target.value as any })} className="input-field">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Due date</label>
              <input type="date" value={values.dueDate} onChange={(e) => setValues({ ...values, dueDate: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Category</label>
            <input value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} className="input-field" placeholder="Nova AI" />
          </div>

          <button type="submit" className="btn-primary w-full">
            {initial ? "Save changes" : "Create task"}
          </button>
        </form>
      </div>
    </div>
  );
}
