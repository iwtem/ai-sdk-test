import type { LucideIcon } from "lucide-react";

export type StatItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function DocumentStats({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <div className="mb-2 inline-flex items-center gap-1.5 text-muted-foreground text-xs">
              <Icon className="size-4" />
              {item.label}
            </div>
            <div className="font-semibold text-2xl">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}
