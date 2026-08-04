/**
 * scripts/streak.ts
 *
 * Responsibility: Pure analytics layer.
 *   - Streak calculations (current, longest)
 *   - Total contribution counting
 *   - Calendar conversion / normalization
 *   - No SVG code, no GitHub API calls
 *
 * All functions are pure: same inputs → same outputs, no side effects.
 * This makes them trivially unit-testable and reusable by other card generators.
 */

import type { GQLContributionDay, GQLContributionCalendar } from "./githubStats.js";

// ─── Exported Types ──────────────────────────────────────────────────────────

/** A normalized contribution day used throughout the analytics layer */
export interface ContributionDay {
  date: string;    // YYYY-MM-DD, always present
  count: number;   // number of contributions (≥ 0)
  level: number;   // 0–4 intensity bucket (GitHub's quartile mapping)
  weekday: number; // 0 = Sunday … 6 = Saturday
}

/** Result of streak calculations */
export interface StreakResult {
  /** Number of consecutive active days ending today (or yesterday) */
  currentStreak: number;
  /** The date the current streak started (YYYY-MM-DD), or "" if streak = 0 */
  currentStreakStart: string;
  /** The last active day of the current streak (YYYY-MM-DD), or "" if streak = 0 */
  currentStreakEnd: string;

  /** All-time longest consecutive active days */
  longestStreak: number;
  /** First day of the longest streak (YYYY-MM-DD) */
  longestStreakStart: string;
  /** Last day of the longest streak (YYYY-MM-DD) */
  longestStreakEnd: string;

  /** Total number of days with at least one contribution */
  totalActiveDays: number;
}

/** All computed metrics passed to the SVG renderer */
export interface CardMetrics {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  /** Normalized days for the intensity strip (last N days) */
  recentDays: ContributionDay[];
}

// ─── Level mapping ────────────────────────────────────────────────────────────

/**
 * Maps GitHub's contributionLevel string to the 0–4 integer level
 * used by the SVG intensity strip.
 */
const LEVEL_MAP: Record<string, number> = {
  NONE:             0,
  FIRST_QUARTILE:  1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE:  3,
  FOURTH_QUARTILE: 4,
};

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Converts the raw GQL calendar structure into a flat, sorted array of
 * normalized ContributionDay objects.
 *
 * Weeks and days come from the API already in chronological order (oldest week
 * first, Sunday first within each week), so we just flatten and re-map.
 */
export function convertContributionCalendar(
  calendar: GQLContributionCalendar
): ContributionDay[] {
  const days: ContributionDay[] = [];

  for (const week of calendar.weeks) {
    for (const raw of week.contributionDays) {
      days.push({
        date: raw.date,
        count: raw.contributionCount,
        level: LEVEL_MAP[raw.contributionLevel] ?? 0,
        weekday: raw.weekday,
      });
    }
  }

  // Sort ascending by date (API usually returns them in order, but be safe)
  days.sort((a, b) => a.date.localeCompare(b.date));

  return days;
}

// ─── Total Contributions ─────────────────────────────────────────────────────

/**
 * Sums the total number of contributions across all days.
 * This matches GitHub's own totalContributions field but is computed
 * from the flat day array so it can be used for any filtered subset.
 */
export function calculateTotalContributions(days: ContributionDay[]): number {
  return days.reduce((sum, day) => sum + day.count, 0);
}

// ─── Current Streak ───────────────────────────────────────────────────────────

/**
 * Calculates the current streak of consecutive active days.
 *
 * "Current" means the streak ending on today OR yesterday — GitHub counts
 * the streak as unbroken if you haven't contributed today yet (today is
 * still in progress). We replicate that logic here.
 *
 * Algorithm:
 *   1. Sort days newest → oldest
 *   2. Determine the reference point:
 *      - If today has contributions → streak may extend through today
 *      - If today has NO contributions → treat yesterday as the potential end
 *   3. Walk backward from the reference point counting consecutive active days
 */
export function calculateCurrentStreak(days: ContributionDay[]): Pick<
  StreakResult,
  "currentStreak" | "currentStreakStart" | "currentStreakEnd"
> {
  if (days.length === 0) {
    return { currentStreak: 0, currentStreakStart: "", currentStreakEnd: "" };
  }

  // Newest to oldest for backward traversal
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  // Determine where the streak window starts:
  // If the most recent day in the dataset is today, start from index 0.
  // If it's yesterday (i.e. today has no data yet), also start from index 0.
  // If the most recent day is older than yesterday, there is no active streak.
  const mostRecent = sorted[0]!;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // The streak can only be active if the last data point is today or yesterday
  const latestActiveDate = mostRecent.date <= todayStr ? mostRecent.date : "";
  if (!latestActiveDate || latestActiveDate < yesterdayStr) {
    return { currentStreak: 0, currentStreakStart: "", currentStreakEnd: "" };
  }

  // Skip today's entry if it has 0 contributions
  // (today might just not be done yet, so we don't break the streak)
  let startIdx = 0;
  if (sorted[0]!.date === todayStr && sorted[0]!.count === 0) {
    startIdx = 1; // skip today, look at yesterday onward
  }

  let streak = 0;
  let streakEnd = "";
  let streakStart = "";

  for (let i = startIdx; i < sorted.length; i++) {
    const day = sorted[i]!;
    if (day.count > 0) {
      streak++;
      if (streak === 1) streakEnd = day.date;
      streakStart = day.date;
    } else {
      // Gap in contributions → streak is broken
      break;
    }
  }

  return {
    currentStreak: streak,
    currentStreakStart: streakStart,
    currentStreakEnd: streakEnd,
  };
}

// ─── Longest Streak ───────────────────────────────────────────────────────────

/**
 * Finds the all-time longest consecutive active-day streak in the dataset.
 *
 * Algorithm:
 *   Walk the days array in chronological order.
 *   Maintain a running count that resets to 0 whenever count === 0.
 *   Track the window [start, end] of the best run found.
 */
export function calculateLongestStreak(days: ContributionDay[]): Pick<
  StreakResult,
  "longestStreak" | "longestStreakStart" | "longestStreakEnd"
> {
  if (days.length === 0) {
    return { longestStreak: 0, longestStreakStart: "", longestStreakEnd: "" };
  }

  // Sort chronologically (oldest first) for forward traversal
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let longestStart = "";
  let longestEnd = "";

  let running = 0;
  let runStart = "";

  for (const day of sorted) {
    if (day.count > 0) {
      running++;
      if (running === 1) runStart = day.date; // beginning of a new run

      if (running > longest) {
        longest = running;
        longestStart = runStart;
        longestEnd = day.date;
      }
    } else {
      // Gap → reset running counter
      running = 0;
      runStart = "";
    }
  }

  return {
    longestStreak: longest,
    longestStreakStart: longestStart,
    longestStreakEnd: longestEnd,
  };
}

// ─── Convenience aggregator ───────────────────────────────────────────────────

/**
 * Runs all calculations and returns the full StreakResult in one call.
 * This is what the main entry-point (index.ts) should call.
 */
export function computeAllStreaks(days: ContributionDay[]): StreakResult {
  const current = calculateCurrentStreak(days);
  const longest = calculateLongestStreak(days);
  const totalActiveDays = days.filter((d) => d.count > 0).length;

  return {
    ...current,
    ...longest,
    totalActiveDays,
  };
}

/**
 * Builds the final CardMetrics object consumed by the SVG renderer.
 *
 * @param days                - All normalized contribution days
 * @param totalContributions  - Pre-computed total (from GQL calendar or sum)
 * @param recentDaysCount     - How many recent days to include in the strip (default: 90)
 */
export function buildCardMetrics(
  days: ContributionDay[],
  totalContributions: number,
  recentDaysCount = 90
): CardMetrics {
  const streaks = computeAllStreaks(days);

  // The intensity strip shows the most recent N days for a compact visualization
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const recentDays = sorted.slice(-recentDaysCount);

  return {
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    totalContributions,
    recentDays,
  };
}
