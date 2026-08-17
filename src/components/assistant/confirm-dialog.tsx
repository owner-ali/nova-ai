"use client";

import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="glass flex items-start gap-3 border-nova-purple/30 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-nova-purple" />
      <div className="flex-1">
        <p className="text-sm text-white/85">{message}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={onConfirm} className="btn-primary px-4 py-1.5 text-xs">Confirm</button>
          <button onClick={onCancel} className="btn-secondary px-4 py-1.5 text-xs">Cancel</button>
        </div>
      </div>
    </div>
  );
}
