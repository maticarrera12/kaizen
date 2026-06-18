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
 * (R5.5). Renders up to CROWDING_CAP mascots (loadCalendar already caps the
 * array, currently 30 — a rare safety net) plus a "+k" overflow badge when
 * overflowCount > 0. Passes the day's total mascot count to each
 * MascotPostIt so its scatter distribution scales (grid spreads across the
 * whole cell instead of clustering at fixed anchors).
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
        "relative flex min-h-32 flex-col gap-1 overflow-hidden rounded-2xl border border-slate-100 bg-surface-card p-2",
        !inMonth && "opacity-40",
      )}
    >
      <span className="text-xs font-semibold text-slate-500">{dayNumber}</span>

      <div
        data-testid="mascot-scatter-area"
        className="relative min-h-24 flex-1"
      >
        {mascots.map((mascot, index) => (
          <MascotPostIt
            key={mascot.id}
            imageUrl={toImageUrl(mascot.imagePath)}
            name={mascot.name}
            habitId={mascot.id}
            date={date}
            indexInDay={index}
            totalInDay={mascots.length}
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
