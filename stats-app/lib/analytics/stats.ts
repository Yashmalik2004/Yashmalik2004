/**
 * lib/analytics/stats.ts
 *
 * Why it exists: Aggregates raw GitHub API numbers into the StatsData shape
 * displayed on Card 3. Pure functions — no API calls.
 */

import type { StatsData } from "../github/types";

interface RawStatsInput {
  stars: number;
  forks: number;
  repos: number;
  commitsThisYear: number;
  commitsLastYear: number;
  restrictedThisYear: number;
  restrictedLastYear: number;
  prsThisYear: number;
  prsLastYear: number;
  issuesThisYear: number;
  issuesLastYear: number;
  totalContributions: number;
  dataWindowDays?: number;
}

/**
 * Computes the final StatsData from raw API numbers.
 * Merges two years of data (current + previous year) for fuller coverage.
 */
export function computeStats(raw: RawStatsInput): StatsData {
  const totalCommits =
    raw.commitsThisYear +
    raw.restrictedThisYear +
    raw.commitsLastYear +
    raw.restrictedLastYear;

  const totalPRs = raw.prsThisYear + raw.prsLastYear;
  const totalIssues = raw.issuesThisYear + raw.issuesLastYear;

  const dataWindowDays = raw.dataWindowDays ?? 730; // default 2 years
  const avgContributionsPerDay =
    dataWindowDays > 0 ? raw.totalContributions / dataWindowDays : 0;

  return {
    totalStars: raw.stars,
    totalCommits,
    totalPRs,
    totalIssues,
    totalForks: raw.forks,
    totalRepos: raw.repos,
    totalContributions: raw.totalContributions,
    avgContributionsPerDay: parseFloat(avgContributionsPerDay.toFixed(2)),
    dataWindowDays,
  };
}

/**
 * Formats a stat value for display. Handles large numbers and decimals.
 * @param value - The numeric stat value
 * @param isDecimal - If true, shows 2 decimal places
 */
export function formatStat(value: number, isDecimal = false): string {
  if (isDecimal) return value.toFixed(2);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}
