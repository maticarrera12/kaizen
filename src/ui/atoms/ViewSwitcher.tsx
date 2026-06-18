import { cn } from "../../lib/cn";

export type ActiveView = "today" | "week" | "month";

export interface ViewSwitcherProps {
  active: ActiveView;
  onChange: (view: ActiveView) => void;
}

const OPTIONS: Array<{ value: ActiveView; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function ViewSwitcher({ active, onChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex rounded-full bg-surface-card p-1 shadow-sm">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={active === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            active === option.value
              ? "bg-primary text-white"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
