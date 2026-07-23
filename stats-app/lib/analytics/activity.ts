/**
 * lib/analytics/activity.ts
 *
 * Why it exists: Computes activity patterns (commits by day/hour) from
 * the flat contribution day array. Pure functions — no API calls.
 *
 * Note on hour-of-day: GitHub's contribution calendar only gives per-day
 * counts, not per-commit timestamps. We simulate hour distribution using
 * a configurable timezone offset (default IST = UTC+5:30) applied to
 * the daily commit date, distributing work across typical coding hours.
 * For richer hour data, commits API (REST) would be needed — but that
 * requires iterating all repos and is heavily rate-limited.
 */

import type { ContributionDay, ActivityData } from "../github/types";

const WEEKDAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/**
 * Computes activity distribution from contribution days.
 *
 * @param days  - Sorted contribution day array
 * @param tzOffsetHours - UTC offset of the user (default: 5.5 for IST)
 */
export function computeActivity(
  days: ContributionDay[],
  tzOffsetHours = 5.5
): ActivityData {
  const byWeekday = new Array<number>(7).fill(0);
  const byHour = new Array<number>(24).fill(0);

  let totalAnalyzed = 0;

  for (const day of days) {
    if (day.count === 0) continue;
    totalAnalyzed += day.count;

    // Weekday from date string
    const d = new Date(day.date + "T12:00:00Z");
    const weekday = day.weekday ?? d.getUTCDay();
    byWeekday[weekday] = (byWeekday[weekday] ?? 0) + day.count;

    // Simulate hour distribution: spread commits across working hours
    // Weight: peak at 10-12 and 15-18 local time (typical dev hours)
    distributeToHours(byHour, day.count, tzOffsetHours);
  }

  // Most productive weekday
  const maxWeekday = byWeekday.reduce(
    (best, v, i) => (v > (byWeekday[best] ?? 0) ? i : best),
    0
  );
  const mostProductiveDay = WEEKDAY_NAMES[maxWeekday] ?? "Unknown";

  // Most productive hour
  const maxHour = byHour.reduce(
    (best, v, i) => (v > (byHour[best] ?? 0) ? i : best),
    0
  );

  return {
    commitsByWeekday: byWeekday,
    commitsByHour: byHour,
    mostProductiveDay,
    mostProductiveHour: maxHour,
    totalAnalyzed,
  };
}

/**
 * Distributes `count` commits across 24 hour buckets using a weighted
 * probability distribution that peaks during typical coding hours.
 * This is an approximation — real per-commit timestamps aren't available
 * from the contribution calendar.
 */
function distributeToHours(
  byHour: number[],
  count: number,
  tzOffsetHours: number
): void {
  // Probability weights for each UTC hour, shifted by timezone
  const weights = [
    0.5, 0.3, 0.2, 0.1, 0.1, 0.1, // 0-5 local: very low
    0.3, 0.8, 1.5, 2.0, 2.5, 2.5, // 6-11 local: morning ramp
    2.0, 1.5, 1.5, 2.0, 2.5, 2.5, // 12-17 local: afternoon peak
    2.0, 1.5, 1.2, 1.0, 0.8, 0.6, // 18-23 local: evening taper
  ];

  const shift = Math.round(tzOffsetHours);
  const total = weights.reduce((s, w) => s + w, 0);

  for (let localH = 0; localH < 24; localH++) {
    const utcH = ((localH - shift) % 24 + 24) % 24;
    const w = weights[localH] ?? 0;
    const allocated = Math.round((w / total) * count);
    byHour[utcH] = (byHour[utcH] ?? 0) + allocated;
  }
}

/** Returns an abbreviated hour label (e.g. 14 → "2p") */
export function hourLabel(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}
