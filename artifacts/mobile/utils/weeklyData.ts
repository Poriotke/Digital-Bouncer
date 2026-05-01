import { DayUsage } from "@/components/UsageChart";
import { ALL_APPS } from "@/context/AegisContext";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Generates deterministic 7-day usage history seeded by calendar date.
 * Returns days in chronological order (oldest → today).
 */
export function buildWeeklyData(todayUsage: Record<string, number>): DayUsage[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const days: DayUsage[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = dateStr === todayStr;

    let usage: Record<string, number>;

    if (isToday) {
      usage = todayUsage;
    } else {
      // Deterministic seed: use date + day-offset so each day is distinct
      const seed = d.getDate() + d.getMonth() * 31 + (6 - i) * 17;
      usage = {};
      ALL_APPS.forEach((app, idx) => {
        const base = isWeekend ? 75 : 48;
        // Each app gets a different slice of the seed
        const variance = ((seed * (idx + 3) + idx * 11) % 70) - 20;
        usage[app.id] = Math.max(3, base + variance);
      });
    }

    const totalMinutes = Object.values(usage).reduce((a, b) => a + b, 0);

    days.push({
      dateStr,
      dayLabel: `${DAY_LABELS[dayOfWeek]}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      shortLabel: isToday ? "Today" : SHORT_LABELS[dayOfWeek],
      isToday,
      isWeekend,
      usage,
      totalMinutes,
    });
  }

  return days;
}
