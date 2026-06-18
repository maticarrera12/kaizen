import type { CalendarDayResult } from "../../application/use-cases/loadCalendar";
import type { LocalDate } from "../../domain/streak/types";
import { DayCell } from "../molecules/DayCell";

export interface WeekViewProps {
  weekDates: LocalDate[]; // exactly 7, Monday..Sunday
  days: Map<LocalDate, CalendarDayResult>;
  toImageUrl: (imagePath: string) => string;
}

export function WeekView({ weekDates, days, toImageUrl }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDates.map((date) => {
        const day = days.get(date);
        return (
          <DayCell
            key={date}
            date={date}
            dayNumber={Number(date.slice(8, 10))}
            inMonth={true}
            mascots={day?.mascots ?? []}
            overflowCount={day?.overflowCount ?? 0}
            toImageUrl={toImageUrl}
          />
        );
      })}
    </div>
  );
}
