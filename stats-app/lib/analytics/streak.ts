/**
 * lib/analytics/streak.ts
 *
 * Why it exists: Computes streak statistics from an array of contribution days.
 * Pure functions — no API calls, no side effects, fully testable.
 *
 * The streak is computed locally from data/contributions.json (updated daily
 * by the existing Python workflow) or from the GraphQL contribution calendar,
 * avoiding any third-party streak API dependency.
 */

import type { ContributionDay, StreakData } from "../github/types";

/**
 * Computes current and longest streak from a sorted (ascending by date)
 * array of contribution days.
 *
 * Rules:
 * - A "streak day" is any day with count > 0.
 * - Current streak: consecutive active days ending at the most recent active day.
 *   If the most recent day in the array has count = 0, we still check the
 *   day before (today might not be finished yet).
 * - Longest streak: the longest contiguous run of active days in the dataset.
 */
export function computeStreak(days: ContributionDay[]): StreakData {
  if (days.length === 0) {
    return emptyStreak();
  }

  // Sort ascending by date (defensive — caller may not guarantee order)
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // ─── Longest streak ────────────────────────────────────────────────────────
  let longestStreak = 0;
  let longestStart = "";
  let longestEnd = "";
  let runLength = 0;
  let runStart = "";

  for (const day of sorted) {
    if (day.count > 0) {
      if (runLength === 0) runStart = day.date;
      runLength++;
      if (runLength > longestStreak) {
        longestStreak = runLength;
        longestStart = runStart;
        longestEnd = day.date;
      }
    } else {
      runLength = 0;
      runStart = "";
    }
  }

  // ─── Current streak ────────────────────────────────────────────────────────
  // Walk backwards; skip the last day if it has 0 contributions
  // (today might not be over yet)
  let endIdx = sorted.length - 1;
  if (sorted[endIdx]?.count === 0 && endIdx > 0) {
    endIdx--;
  }

  let currentStreak = 0;
  let currentStreakEnd = "";
  let currentStreakStart = "";

  for (let i = endIdx; i >= 0; i--) {
    const day = sorted[i];
    if (!day || day.count === 0) break;
    currentStreak++;
    currentStreakEnd = currentStreakEnd || day.date;
    currentStreakStart = day.date;
  }

  // ─── Total active days ─────────────────────────────────────────────────────
  const totalActiveDays = sorted.filter((d) => d.count > 0).length;

  return {
    currentStreak,
    longestStreak,
    currentStreakStart,
    currentStreakEnd,
    longestStreakStart: longestStart,
    longestStreakEnd: longestEnd,
    totalActiveDays,
  };
}

/** Formats a streak date range as "MMM D – MMM D, YYYY" */
export function formatStreakRange(start: string, end: string): string {
  if (!start || !end) return "—";
  const fmt = (iso: string): string => {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };
  if (start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Returns today's date as YYYY-MM-DD in UTC */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyStreak(): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    currentStreakStart: "",
    currentStreakEnd: "",
    longestStreakStart: "",
    longestStreakEnd: "",
    totalActiveDays: 0,
  };
}
