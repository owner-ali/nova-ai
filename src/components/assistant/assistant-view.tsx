"use client";

import { useEffect, useRef, useState } from "react";
import { Send, RotateCcw, Mic, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { ConversationList, type ConversationSummary } from "./conversation-list";
import { MessageBubble } from "./message-bubble";
import { VoiceButton } from "./voice-button";
import { ConfirmDialog } from "./confirm-dialog";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function AssistantView({
  initialConversations,
  autoSpeak,
}: {
  initialConversations: ConversationSummary[];
  autoSpeak: boolean;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ name: string; args: any } | null>(null);
  const [pendingMessageText, setPendingMessageText] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeId) loadConversation(activeId);
    else setMessages([]);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function loadConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(
      data.conversation.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content }))
    );
  }

  async function sendMessage(text: string, confirmedToolName?: string) {
    if (!text.trim()) return;
    setLoading(true);
    setPendingConfirmation(null);

    const optimistic: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text };
    if (!confirmedToolName) setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, message: text, confirmedToolName }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Nova's AI service is temporarily unavailable.");
        return;
      }

      if (!activeId) {
        setActiveId(data.conversationId);
        setConversations((prev) => [{ id: data.conversationId, title: text.slice(0, 60), updatedAt: new Date().toISOString() }, ...prev]);
      }

      if (data.pendingConfirmation) {
        setPendingConfirmation(data.pendingConfirmation);
        setPendingMessageText(text);
      }

      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: data.reply }]);
    } catch {
      toast.error("Unable to reach Nova right now. Please try again.");
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  async function handleVoiceCommand(transcript: string) {
    const res = await fetch("/api/ai/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: transcript }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMessages((prev) => [
      ...prev,
      { id: `v-user-${Date.now()}`, role: "user", content: transcript },
      { id: `v-assistant-${Date.now()}`, role: "assistant", content: data.reply },
    ]);

    return { reply: data.reply as string };
  }

  async function handleNewConversation() {
    setActiveId(null);
    setMessages([]);
  }

  async function handleDeleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
    toast.success("Conversation deleted");
  }

  async function handleRenameConversation(id: string, title: string) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }

  function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.content);
  }

  return (
    <div className="flex h-screen">
      {showSidebar && (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar((s) => !s)} className="hidden text-white/50 hover:text-white lg:block">
              {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <h1 className="font-display text-sm font-semibold">Nova Assistant</h1>
          </div>
          <button onClick={() => setShowVoice((v) => !v)} className={cn("btn-secondary text-xs", showVoice && "border-nova-green/40 text-nova-green")}>
            <Mic className="h-3.5 w-3.5" /> Voice
          </button>
        </header>

        {showVoice && (
          <div className="flex justify-center border-b border-line bg-white/[0.015] py-6">
            <VoiceButton onCommand={handleVoiceCommand} autoSpeak={autoSpeak} />
          </div>
        )}

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md pt-16 text-center">
              <p className="font-display text-lg font-semibold">What should we get done today?</p>
              <p className="mt-2 text-sm text-white/45">
                Try: &quot;Create a task called Finish my portfolio&quot; or &quot;What&apos;s on my calendar today?&quot;
              </p>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-nova-ai" />
              <div className="glass flex items-center gap-1 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:300ms]" />
              </div>
            </div>
          )}
          {pendingConfirmation && (
            <ConfirmDialog
              message={`Nova wants to run "${pendingConfirmation.name}". This action can't be undone.`}
              onConfirm={() => sendMessage(pendingMessageText, pendingConfirmation.name)}
              onCancel={() => setPendingConfirmation(null)}
            />
          )}
        </div>

        <div className="border-t border-line p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <button onClick={regenerate} disabled={loading || messages.length === 0} className="btn-secondary shrink-0 px-3 py-2.5 disabled:opacity-30">
              <RotateCcw className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Message Nova..."
              className="input-field max-h-32 flex-1 resize-none"
            />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="btn-primary shrink-0 px-4 py-2.5 disabled:opacity-30">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
