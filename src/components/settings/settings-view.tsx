"use client";

import { useState } from "react";
import { toast } from "sonner";
import { User, Bot, Mic, Bell, Palette, Shield, Plug } from "lucide-react";

type SettingsUser = {
  name: string | null;
  email: string;
  assistantName: string;
  responseStyle: string;
  memoryEnabled: boolean;
  voiceEnabled: boolean;
  voiceSpeed: number;
  voiceLanguage: string;
  autoSpeak: boolean;
};

export function SettingsView({ initialUser }: { initialUser: SettingsUser }) {
  const [user, setUser] = useState(initialUser);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "" });

  async function save(patch: Partial<SettingsUser>) {
    setSaving(true);
    const merged = { ...user, ...patch };
    setUser(merged);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to save settings.");
      return;
    }
    toast.success("Saved");
  }

  async function changePassword() {
    if (!passwords.current || passwords.next.length < 8) {
      toast.error("Enter your current password and a new password (min 8 characters).");
      return;
    }
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Unable to change password.");
      return;
    }
    toast.success("Password updated");
    setPasswords({ current: "", next: "" });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        {saving && <span className="text-xs text-white/40">Saving...</span>}
      </div>

      <Section icon={User} title="Profile">
        <Field label="Name">
          <input defaultValue={user.name ?? ""} onBlur={(e) => save({ name: e.target.value })} className="input-field" />
        </Field>
        <Field label="Email">
          <input value={user.email} disabled className="input-field opacity-50" />
        </Field>
      </Section>

      <Section icon={Bot} title="AI Preferences">
        <Field label="Assistant name">
          <input defaultValue={user.assistantName} onBlur={(e) => save({ assistantName: e.target.value })} className="input-field" />
        </Field>
        <Field label="Response style">
          <select value={user.responseStyle} onChange={(e) => save({ responseStyle: e.target.value })} className="input-field">
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="friendly">Friendly</option>
          </select>
        </Field>
        <Toggle label="Memory enabled" checked={user.memoryEnabled} onChange={(v) => save({ memoryEnabled: v })} />
      </Section>

      <Section icon={Mic} title="Voice">
        <Toggle label="Voice enabled" checked={user.voiceEnabled} onChange={(v) => save({ voiceEnabled: v })} />
        <Toggle label="Auto-speak responses" checked={user.autoSpeak} onChange={(v) => save({ autoSpeak: v })} />
        <Field label="Speech speed">
          <input type="range" min={0.5} max={2} step={0.1} defaultValue={user.voiceSpeed} onMouseUp={(e) => save({ voiceSpeed: Number((e.target as HTMLInputElement).value) })} className="w-full accent-nova-green" />
        </Field>
        <Field label="Language">
          <select value={user.voiceLanguage} onChange={(e) => save({ voiceLanguage: e.target.value })} className="input-field">
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="ur-PK">Urdu (Pakistan)</option>
            <option value="es-ES">Spanish</option>
          </select>
        </Field>
      </Section>

      <Section icon={Bell} title="Notifications">
        <p className="text-sm text-white/50">Browser notifications for reminders are requested automatically the first time a reminder is due while Nova AI is open.</p>
      </Section>

      <Section icon={Palette} title="Appearance">
        <p className="text-sm text-white/50">Nova AI currently ships with a premium dark theme. Light theme support is on the roadmap.</p>
      </Section>

      <Section icon={Shield} title="Security">
        <Field label="Current password">
          <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="input-field" />
        </Field>
        <Field label="New password">
          <input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className="input-field" />
        </Field>
        <button onClick={changePassword} className="btn-secondary">Update password</button>
      </Section>

      <Section icon={Plug} title="Connected Apps">
        <p className="text-sm text-white/50">Google Calendar and other integrations can be connected here once configured by your administrator.</p>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="glass mb-5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-nova-green" />
        <h2 className="font-display text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/60">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/75">{label}</span>
      <button onClick={() => onChange(!checked)} className={`h-5 w-9 rounded-full p-0.5 transition-colors ${checked ? "bg-nova-green" : "bg-white/15"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}
