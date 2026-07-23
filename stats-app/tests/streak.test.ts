/**
 * tests/streak.test.ts
 *
 * Unit tests for the streak computation algorithm (lib/analytics/streak.ts).
 * Tests cover: normal streaks, gap handling, empty input, unsorted input,
 * today-is-zero edge case, single active day, and the "other" longest streak.
 */

import { describe, it, expect } from "vitest";
import { computeStreak, formatStreakRange } from "../lib/analytics/streak";
import type { ContributionDay } from "../lib/github/types";

function days(dates: string[], counts: number[]): ContributionDay[] {
  return dates.map((date, i) => ({
    date,
    count: counts[i] ?? 0,
    level: counts[i] && counts[i]! > 0 ? 1 : 0,
  }));
}

describe("computeStreak", () => {
  it("returns zero streak for empty input", () => {
    const result = computeStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalActiveDays).toBe(0);
  });

  it("computes current streak from consecutive active days", () => {
    const d = days(
      ["2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21"],
      [3, 5, 2, 8]
    );
    const result = computeStreak(d);
    expect(result.currentStreak).toBe(4);
    expect(result.currentStreakStart).toBe("2026-07-18");
    expect(result.currentStreakEnd).toBe("2026-07-21");
  });

  it("skips trailing zero day (today not finished)", () => {
    const d = days(
      ["2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21"],
      [3, 5, 2, 0]   // today = 0
    );
    const result = computeStreak(d);
    // Should still count the 3 active days before today
    expect(result.currentStreak).toBe(3);
    expect(result.currentStreakEnd).toBe("2026-07-20");
  });

  it("breaks current streak at a gap", () => {
    const d = days(
      ["2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19"],
      [4, 2, 0, 5, 3]   // gap on 17th
    );
    const result = computeStreak(d);
    expect(result.currentStreak).toBe(2);
    expect(result.currentStreakStart).toBe("2026-07-18");
  });

  it("computes longest streak correctly", () => {
    const d = days(
      ["2026-07-10", "2026-07-11", "2026-07-12", "2026-07-13",
       "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"],
      [1, 2, 0, 3, 4, 5, 6, 0]   // run of 4 on 13-16
    );
    const result = computeStreak(d);
    expect(result.longestStreak).toBe(4);
    expect(result.longestStreakStart).toBe("2026-07-13");
    expect(result.longestStreakEnd).toBe("2026-07-16");
  });

  it("handles unsorted input by sorting first", () => {
    const d = days(
      ["2026-07-20", "2026-07-18", "2026-07-19"],  // out of order
      [5, 3, 4]
    );
    const result = computeStreak(d);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("counts total active days", () => {
    const d = days(
      ["2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18"],
      [0, 1, 0, 2]
    );
    const result = computeStreak(d);
    expect(result.totalActiveDays).toBe(2);
  });

  it("handles single active day", () => {
    const d = days(["2026-07-21"], [1]);
    const result = computeStreak(d);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("handles all-zero days", () => {
    const d = days(["2026-07-18", "2026-07-19", "2026-07-20"], [0, 0, 0]);
    const result = computeStreak(d);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });
});

describe("formatStreakRange", () => {
  it("formats a date range", () => {
    const result = formatStreakRange("2026-07-15", "2026-07-20");
    expect(result).toContain("Jul");
    expect(result).toContain("–");
  });

  it("formats a single day", () => {
    const result = formatStreakRange("2026-07-20", "2026-07-20");
    expect(result).not.toContain("–");
  });

  it("returns dash for empty dates", () => {
    const result = formatStreakRange("", "");
    expect(result).toBe("—");
  });
});
