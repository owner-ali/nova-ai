"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, Square, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [25, 45, 60, 90];

export function FocusView() {
  const [duration, setDuration] = useState(25);
  const [taskLabel, setTaskLabel] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          completeSession();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function start() {
    const res = await fetch("/api/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMin: duration, taskLabel: taskLabel || undefined }),
    });
    const data = await res.json();
    if (res.ok) setSessionId(data.session.id);
    setSecondsLeft(duration * 60);
    setRunning(true);
  }

  async function completeSession() {
    if (sessionId) await fetch(`/api/focus/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    toast.success("Focus session completed 🎯");
    setSessionId(null);
  }

  async function stop() {
    setRunning(false);
    if (sessionId) await fetch(`/api/focus/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    });
    setSessionId(null);
    setSecondsLeft(duration * 60);
  }

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = 1 - secondsLeft / (duration * 60);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-16 text-center">
      <Target className="mb-3 h-6 w-6 text-nova-green" />
      <h1 className="font-display text-2xl font-semibold">Focus Mode</h1>
      <p className="mt-1 text-sm text-white/45">Deep work, timed.</p>

      {!sessionId && (
        <>
          <input
            value={taskLabel}
            onChange={(e) => setTaskLabel(e.target.value)}
            placeholder="What are you focusing on?"
            className="input-field mt-8 w-full"
          />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => { setDuration(d); setSecondsLeft(d * 60); }}
                className={cn("rounded-lg border border-line px-3 py-2 text-sm", duration === d ? "border-nova-green/50 bg-nova-green/10 text-nova-green" : "text-white/60")}
              >
                {d}m
              </button>
            ))}
          </div>
        </>
      )}

      <div className="relative my-10 flex h-56 w-56 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="46" fill="none" stroke="#3EEBA5" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="font-display text-4xl font-semibold">{mins}:{secs}</span>
      </div>

      <div className="flex gap-3">
        {!sessionId ? (
          <button onClick={start} className="btn-primary px-8 py-3"><Play className="h-4 w-4" /> Start</button>
        ) : (
          <>
            <button onClick={() => setRunning((r) => !r)} className="btn-secondary px-6 py-3">
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {running ? "Pause" : "Resume"}
            </button>
            <button onClick={stop} className="btn-secondary px-6 py-3 text-red-400"><Square className="h-4 w-4" /> Stop</button>
          </>
        )}
      </div>
    </div>
  );
}
