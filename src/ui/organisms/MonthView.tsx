import type { CalendarDayResult } from "../../application/use-cases/loadCalendar";
import type { MonthGridDay } from "../../domain/calendar/grid";
import type { LocalDate } from "../../domain/streak/types";
import { DayCell } from "../molecules/DayCell";
import { WeekdayHeader } from "../atoms/WeekdayHeader";

export interface MonthViewProps {
  grid: MonthGridDay[]; // 35 or 42 cells, Monday-start, leading/trailing tagged
  days: Map<LocalDate, CalendarDayResult>;
  toImageUrl: (imagePath: string) => string;
}

export function MonthView({ grid, days, toImageUrl }: MonthViewProps) {
  return (
    <div>
      <WeekdayHeader />
      <div className="grid grid-cols-7 gap-2">
        {grid.map((cell) => {
          const day = days.get(cell.date);
          return (
            <DayCell
              key={cell.date}
              date={cell.date}
              dayNumber={Number(cell.date.slice(8, 10))}
              inMonth={cell.inMonth}
              mascots={day?.mascots ?? []}
              overflowCount={day?.overflowCount ?? 0}
              toImageUrl={toImageUrl}
            />
          );
        })}
      </div>
    </div>
  );
}
