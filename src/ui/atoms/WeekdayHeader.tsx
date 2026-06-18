const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Monday-first weekday label row, aligned to the same 7-column grid as
 * `WeekView`/`MonthView` (R: calendar must show day names matching the
 * Monday-start grid used everywhere else in this feature).
 */
export function WeekdayHeader() {
  return (
    <div
      data-testid="weekday-header"
      className="grid grid-cols-7 gap-2 px-2 pb-1"
    >
      {WEEKDAY_LABELS.map((label) => (
        <span
          key={label}
          className="text-center text-xs font-semibold text-slate-400"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
