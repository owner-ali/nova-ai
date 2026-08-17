"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CalEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function CalendarView({ initialEvents }: { initialEvents: CalEvent[] }) {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState(initialEvents);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", startTime: "09:00", endTime: "10:00", location: "" });

  const monthStart = startOfMonth(cursor);
  const firstWeekday = monthStart.getDay();
  const totalDays = daysInMonth(cursor);
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];

  function eventsOn(day: number) {
    const target = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    return events.filter((e) => {
      const s = new Date(e.startTime);
      return s.getFullYear() === target.getFullYear() && s.getMonth() === target.getMonth() && s.getDate() === target.getDate();
    });
  }

  async function refresh() {
    const res = await fetch("/api/calendar");
    const data = await res.json();
    setEvents(data.events);
  }

  async function createEvent() {
    if (!selectedDay || !form.title.trim()) return;
    const start = new Date(selectedDay);
    const [sh, sm] = form.startTime.split(":").map(Number);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(selectedDay);
    const [eh, em] = form.endTime.split(":").map(Number);
    end.setHours(eh, em, 0, 0);

    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, location: form.location || undefined, startTime: start.toISOString(), endTime: end.toISOString() }),
    });
    if (!res.ok) {
      toast.error("Unable to create event.");
      return;
    }
    toast.success("Event scheduled");
    setShowForm(false);
    setForm({ title: "", startTime: "09:00", endTime: "10:00", location: "" });
    refresh();
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="btn-secondary px-2.5 py-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-36 text-center text-sm font-medium">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="btn-secondary px-2.5 py-2">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="glass p-4">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-white/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dayEvents = eventsOn(day);
            const isToday = new Date().toDateString() === new Date(cursor.getFullYear(), cursor.getMonth(), day).toDateString();
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDay(new Date(cursor.getFullYear(), cursor.getMonth(), day));
                  setShowForm(false);
                }}
                className={cn(
                  "flex min-h-20 flex-col items-start rounded-lg border border-line p-2 text-left transition-colors hover:bg-white/[0.04]",
                  isToday && "border-nova-green/40"
                )}
              >
                <span className={cn("text-xs", isToday ? "font-semibold text-nova-green" : "text-white/60")}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div key={e.id} className="truncate rounded bg-nova-blue/15 px-1 py-0.5 text-[10px] text-nova-blue">{e.title}</div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-white/40">+{dayEvents.length - 2} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="glass mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">
              {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowForm((s) => !s)} className="btn-secondary px-3 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add event
              </button>
              <button onClick={() => setSelectedDay(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showForm && (
            <div className="mb-4 space-y-3 rounded-lg border border-line bg-white/[0.02] p-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
              </div>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location (optional)" className="input-field" />
              <button onClick={createEvent} className="btn-primary w-full">Save event</button>
            </div>
          )}

          <div className="space-y-2">
            {eventsOn(selectedDay.getDate()).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
                    {new Date(e.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} –{" "}
                    {new Date(e.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    {e.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
                    )}
                  </p>
                </div>
                <button onClick={() => deleteEvent(e.id)} className="p-1 text-white/40 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {eventsOn(selectedDay.getDate()).length === 0 && <p className="text-sm text-white/35">No events this day.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
