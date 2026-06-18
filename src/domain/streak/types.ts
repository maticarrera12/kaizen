export type LocalDate = string; // YYYY-MM-DD, local calendar date, no timezone conversion

export interface DailyRecord {
  date: LocalDate;
  completed: boolean;
}

export interface StreakInput {
  records: DailyRecord[]; // sparse, completed=1 rows only, any order
  today: LocalDate;
  createdAt: LocalDate; // habit.created_at, lower bound — never penalize pre-creation days
  skipWeekends: boolean; // true: unmarked Sat/Sun are neutral, not misses
}
