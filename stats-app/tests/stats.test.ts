/**
 * tests/stats.test.ts
 *
 * Unit tests for stats analytics (lib/analytics/stats.ts).
 */

import { describe, it, expect } from "vitest";
import { computeStats, formatStat } from "../lib/analytics/stats";

const baseInput = {
  stars: 42,
  forks: 7,
  repos: 15,
  commitsThisYear: 200,
  commitsLastYear: 150,
  restrictedThisYear: 10,
  restrictedLastYear: 5,
  prsThisYear: 8,
  prsLastYear: 4,
  issuesThisYear: 12,
  issuesLastYear: 6,
  totalContributions: 358,
  dataWindowDays: 730,
};

describe("computeStats", () => {
  it("sums commits across years including restricted", () => {
    const result = computeStats(baseInput);
    expect(result.totalCommits).toBe(200 + 10 + 150 + 5); // 365
  });

  it("sums PRs across years", () => {
    const result = computeStats(baseInput);
    expect(result.totalPRs).toBe(12);
  });

  it("sums issues across years", () => {
    const result = computeStats(baseInput);
    expect(result.totalIssues).toBe(18);
  });

  it("passes stars and forks through", () => {
    const result = computeStats(baseInput);
    expect(result.totalStars).toBe(42);
    expect(result.totalForks).toBe(7);
  });

  it("computes avgContributionsPerDay", () => {
    const result = computeStats(baseInput);
    const expected = parseFloat((358 / 730).toFixed(2));
    expect(result.avgContributionsPerDay).toBe(expected);
  });

  it("defaults dataWindowDays to 730", () => {
    const { dataWindowDays: _, ...withoutWindow } = baseInput;
    const result = computeStats(withoutWindow);
    expect(result.dataWindowDays).toBe(730);
  });

  it("handles zero contributions gracefully", () => {
    const result = computeStats({ ...baseInput, totalContributions: 0 });
    expect(result.avgContributionsPerDay).toBe(0);
  });
});

describe("formatStat", () => {
  it("formats numbers under 1000 as-is", () => {
    expect(formatStat(42)).toBe("42");
    expect(formatStat(999)).toBe("999");
  });

  it("formats thousands as 'k'", () => {
    expect(formatStat(1500)).toBe("1.5k");
    expect(formatStat(10000)).toBe("10.0k");
  });

  it("formats millions as 'M'", () => {
    expect(formatStat(1_200_000)).toBe("1.2M");
  });

  it("formats decimals when isDecimal=true", () => {
    expect(formatStat(0.49, true)).toBe("0.49");
    expect(formatStat(3.14159, true)).toBe("3.14");
  });
});
