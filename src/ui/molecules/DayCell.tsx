import type { CalendarMascot } from "../../application/use-cases/loadCalendar";
import type { LocalDate } from "../../domain/streak/types";
import { cn } from "../../lib/cn";
import { MascotPostIt } from "../atoms/MascotPostIt";

export interface DayCellProps {
  date: LocalDate;
  dayNumber: number;
  inMonth: boolean;
  mascots: CalendarMascot[];
  overflowCount: number;
  toImageUrl: (imagePath: string) => string;
}

/**
 * Read-only by construction — no onToggle/onEdit prop, mirrors MascotPostIt
 * (R5.5). Renders up to 6 mascots (loadCalendar already caps the array) plus
 * a "+k" overflow badge when overflowCount > 0.
 */
export function DayCell({
  date,
  dayNumber,
  inMonth,
  mascots,
  overflowCount,
  toImageUrl,
}: DayCellProps) {
  return (
    <div
      data-testid="day-cell"
      className={cn(
        "relative flex min-h-24 flex-col gap-1 rounded-2xl border border-slate-100 bg-surface-card p-2",
        !inMonth && "opacity-40",
      )}
    >
      <span className="text-xs font-semibold text-slate-500">{dayNumber}</span>

      <div className="relative flex-1">
        {mascots.map((mascot, index) => (
          <MascotPostIt
            key={mascot.id}
            imageUrl={toImageUrl(mascot.imagePath)}
            name={mascot.name}
            habitId={mascot.id}
            date={date}
            indexInDay={index}
          />
        ))}
      </div>

      {overflowCount > 0 && (
        <span className="self-end rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
          +{overflowCount}
        </span>
      )}
    </div>
  );
}
