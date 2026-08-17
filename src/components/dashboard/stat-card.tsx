import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: "green" | "purple";
}) {
  return (
    <div className="glass glass-hover p-5">
      <div
        className={
          "mb-3 flex h-9 w-9 items-center justify-center rounded-lg " +
          (accent === "green" ? "bg-nova-green/15" : "bg-nova-purple/15")
        }
      >
        <Icon className={"h-4 w-4 " + (accent === "green" ? "text-nova-green" : "text-nova-purple")} />
      </div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/50">{label}</p>
    </div>
  );
}
