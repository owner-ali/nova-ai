"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2, X, Send } from "lucide-react";

type Doc = { id: string; fileName: string; fileType: string; fileSize: number; summary: string | null; storageUrl: string; createdAt: string };

export function DocumentsView({ initialDocuments }: { initialDocuments: Doc[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [openDoc, setOpenDoc] = useState<Doc | null>(null);
  const [question, setQuestion] = useState("");
  const [qa, setQa] = useState<{ q: string; a: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.documents);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Unable to upload document.");
      return;
    }
    toast.success("Document uploaded and summarized.");
    refresh();
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setOpenDoc(null);
    toast.success("Document deleted");
    refresh();
  }

  async function askQuestion() {
    if (!openDoc || !question.trim()) return;
    setAsking(true);
    const res = await fetch(`/api/documents/${openDoc.id}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAsking(false);
    if (!res.ok) {
      toast.error(data.error ?? "Unable to answer.");
      return;
    }
    setQa((prev) => [...prev, { q: question, a: data.answer }]);
    setQuestion("");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold">Documents</h1>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary self-start">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload document
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx,.doc"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {documents.map((d) => (
          <button key={d.id} onClick={() => { setOpenDoc(d); setQa([]); }} className="glass glass-hover flex items-start gap-3 p-5 text-left">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nova-blue/15">
              <FileText className="h-4 w-4 text-nova-blue" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.fileName}</p>
              <p className="mt-1 line-clamp-2 text-xs text-white/45">{d.summary ?? "Processing..."}</p>
            </div>
          </button>
        ))}
        {documents.length === 0 && <p className="col-span-full py-16 text-center text-sm text-white/35">No documents uploaded yet.</p>}
      </div>

      {openDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpenDoc(null)}>
          <div className="glass flex max-h-[85vh] w-full max-w-2xl flex-col p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display truncate text-base font-semibold">{openDoc.fileName}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteDoc(openDoc.id)} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                <button onClick={() => setOpenDoc(null)}><X className="h-4 w-4 text-white/40" /></button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {openDoc.summary && (
                <div className="rounded-lg border border-line bg-white/[0.02] p-4">
                  <p className="label-eyebrow mb-1.5">Summary</p>
                  <p className="text-sm text-white/80">{openDoc.summary}</p>
                </div>
              )}

              {qa.map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium text-white/85">{item.q}</p>
                  <p className="rounded-lg border border-nova-purple/25 bg-nova-purple/5 p-3 text-sm text-white/75">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askQuestion()}
                placeholder="Ask a question about this document..."
                className="input-field flex-1"
              />
              <button onClick={askQuestion} disabled={asking} className="btn-primary px-3 py-2.5">
                {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
