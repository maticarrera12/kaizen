import { useEffect, useState } from "react";
import "./App.css";
import { createHabitTrackerApp } from "./infrastructure/composition/createHabitTrackerApp";
import type { HabitTrackerApp } from "./infrastructure/composition/createHabitTrackerApp";
import { createHabitStore } from "./state/habitStore";
import { createCalendarStore } from "./state/calendarStore";
import { TodayView } from "./ui/views/TodayView";
import { CalendarView } from "./ui/views/CalendarView";
import { ViewSwitcher } from "./ui/atoms/ViewSwitcher";
import type { ActiveView } from "./ui/atoms/ViewSwitcher";

interface AppRuntime {
  app: HabitTrackerApp;
  useHabitStore: ReturnType<typeof createHabitStore>;
  useCalendarStore: ReturnType<typeof createCalendarStore>;
}

function App() {
  const [runtime, setRuntime] = useState<AppRuntime | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("today");

  useEffect(() => {
    let isMounted = true;
    createHabitTrackerApp().then((app) => {
      if (!isMounted) return;
      setRuntime({
        app,
        useHabitStore: createHabitStore(app),
        useCalendarStore: createCalendarStore(app),
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!runtime) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <p className="font-display text-lg text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <>
      <div className="flex justify-center bg-surface pt-6">
        <ViewSwitcher active={activeView} onChange={setActiveView} />
      </div>
      {activeView === "today" && (
        <TodayView useHabitStore={runtime.useHabitStore} app={runtime.app} />
      )}
      {activeView === "week" && (
        <main className="min-h-screen bg-surface px-6 py-10">
          <CalendarView
            useCalendarStore={runtime.useCalendarStore}
            app={runtime.app}
            mode="week"
          />
        </main>
      )}
      {activeView === "month" && (
        <main className="min-h-screen bg-surface px-6 py-10">
          <CalendarView
            useCalendarStore={runtime.useCalendarStore}
            app={runtime.app}
            mode="month"
          />
        </main>
      )}
    </>
  );
}

export default App;
