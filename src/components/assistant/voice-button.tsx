"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "listening" | "processing" | "executing" | "done" | "error";

const STATE_LABEL: Record<VoiceState, string> = {
  idle: "Tap to talk",
  listening: "Listening...",
  processing: "Thinking...",
  executing: "Working...",
  done: "Done.",
  error: "Microphone permission is required.",
};

export function VoiceButton({
  onCommand,
  autoSpeak,
}: {
  onCommand: (transcript: string) => Promise<{ reply: string }>;
  autoSpeak: boolean;
}) {
  const [state, setState] = useState<VoiceState>("idle");
  const recognitionRef = useRef<any>(null);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!supported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setState("processing");
      try {
        setState("executing");
        const result = await onCommand(transcript);
        setState("done");
        if (autoSpeak && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(result.reply);
          window.speechSynthesis.speak(utterance);
        }
      } catch {
        setState("error");
      } finally {
        setTimeout(() => setState("idle"), 1800);
      }
    };

    recognition.onerror = () => {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    };

    recognition.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
  }, [supported, onCommand, autoSpeak]);

  function toggleListening() {
    if (!supported || !recognitionRef.current) {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    if (state === "listening") {
      recognitionRef.current.stop();
      setState("idle");
      return;
    }
    try {
      recognitionRef.current.start();
      setState("listening");
    } catch {
      setState("error");
    }
  }

  const Icon = state === "processing" || state === "executing" ? Loader2 : state === "done" ? Check : Mic;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {state === "listening" && (
          <>
            <span className="absolute inset-0 animate-pulseRing rounded-full bg-nova-green/40" />
            <span className="absolute inset-0 animate-pulseRing rounded-full bg-nova-green/30 [animation-delay:0.4s]" />
          </>
        )}
        <button
          onClick={toggleListening}
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full bg-nova-btn shadow-glow transition-transform active:scale-95",
            state === "error" && "bg-red-500 shadow-none"
          )}
          aria-label="Toggle voice assistant"
        >
          <Icon className={cn("h-8 w-8 text-base-950", (state === "processing" || state === "executing") && "animate-spin")} />
        </button>
      </div>
      <p className="text-sm text-white/60">{STATE_LABEL[state]}</p>
      {!supported && (
        <p className="max-w-xs text-center text-xs text-white/35">
          Voice isn&apos;t supported in this browser. Try Chrome or Edge on desktop, or continue by typing below.
        </p>
      )}
    </div>
  );
}
