/**
 * tests/activity.test.ts
 *
 * Unit tests for activity analytics (lib/analytics/activity.ts).
 */

import { describe, it, expect } from "vitest";
import { computeActivity, hourLabel } from "../lib/analytics/activity";
import type { ContributionDay } from "../lib/github/types";

function day(date: string, count: number, weekday: number): ContributionDay {
  return { date, count, level: count > 0 ? 1 : 0, weekday };
}

describe("computeActivity", () => {
  it("returns zero arrays for empty input", () => {
    const result = computeActivity([]);
    expect(result.commitsByWeekday).toHaveLength(7);
    expect(result.commitsByHour).toHaveLength(24);
    expect(result.totalAnalyzed).toBe(0);
    expect(result.commitsByWeekday.every((v) => v === 0)).toBe(true);
  });

  it("correctly assigns commits to weekdays", () => {
    const d = [
      day("2026-07-20", 5, 1),  // Monday
      day("2026-07-21", 3, 2),  // Tuesday
      day("2026-07-22", 0, 3),  // Wednesday (zero)
    ];
    const result = computeActivity(d, 0); // UTC
    expect(result.commitsByWeekday[1]).toBe(5); // Mon
    expect(result.commitsByWeekday[2]).toBe(3); // Tue
    expect(result.commitsByWeekday[3]).toBe(0); // Wed
  });

  it("identifies the most productive day", () => {
    const d = [
      day("2026-07-18", 1, 6),  // Saturday
      day("2026-07-20", 10, 1), // Monday — peak
      day("2026-07-21", 2, 2),  // Tuesday
    ];
    const result = computeActivity(d, 0);
    expect(result.mostProductiveDay).toBe("Monday");
  });

  it("identifies the most productive hour", () => {
    const result = computeActivity([
      day("2026-07-20", 100, 1), // big count
    ], 0);
    // Hour distribution should have a peak somewhere
    const maxHour = result.commitsByHour.reduce(
      (best, v, i) => (v > (result.commitsByHour[best] ?? 0) ? i : best),
      0
    );
    expect(result.mostProductiveHour).toBe(maxHour);
  });

  it("sums total analyzed contributions", () => {
    const d = [
      day("2026-07-18", 5, 6),
      day("2026-07-19", 0, 0),
      day("2026-07-20", 10, 1),
    ];
    const result = computeActivity(d, 0);
    expect(result.totalAnalyzed).toBe(15);
  });

  it("byHour array has exactly 24 elements", () => {
    const d = [day("2026-07-20", 8, 1)];
    const result = computeActivity(d, 5.5);
    expect(result.commitsByHour).toHaveLength(24);
  });

  it("byWeekday array has exactly 7 elements", () => {
    const d = [day("2026-07-20", 8, 1)];
    const result = computeActivity(d, 0);
    expect(result.commitsByWeekday).toHaveLength(7);
  });
});

describe("hourLabel", () => {
  it("labels midnight as 12a", () => {
    expect(hourLabel(0)).toBe("12a");
  });

  it("labels noon as 12p", () => {
    expect(hourLabel(12)).toBe("12p");
  });

  it("labels AM hours correctly", () => {
    expect(hourLabel(9)).toBe("9a");
    expect(hourLabel(1)).toBe("1a");
  });

  it("labels PM hours correctly", () => {
    expect(hourLabel(14)).toBe("2p");
    expect(hourLabel(23)).toBe("11p");
  });
});
