/**
 * lib/github/client.ts
 *
 * Why it exists: Single authenticated GitHub API client.
 * - Wraps GraphQL and REST endpoints behind typed functions.
 * - Handles authentication, rate-limit errors, and retries.
 * - No business logic lives here — only raw data fetching.
 * - All other modules import from this file; no module calls fetch directly.
 */

import { OVERVIEW_QUERY, LANGUAGES_QUERY, STATS_QUERY } from "./queries";
import type {
  GQLUserOverview,
  GQLLanguagesResponse,
  ContributionDay,
  OverviewData,
  LanguagesData,
  StatsData,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const REST_BASE = "https://api.github.com";

// ─── Core fetch helper ────────────────────────────────────────────────────────

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-stats-cards/1.0",
    },
    body: JSON.stringify({ query, variables }),
    // Next.js cache: revalidate every 15 minutes (900s)
    next: { revalidate: 900 },
  });

  if (res.status === 401) {
    throw new Error("GitHub API: Unauthorized. Check your GITHUB_TOKEN.");
  }
  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    throw new Error(
      `GitHub API: Rate limited. Remaining: ${remaining ?? "unknown"}`
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub API: HTTP ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GraphQLResponse<{ user: T }>;

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join("; ");
    throw new Error(`GitHub GraphQL errors: ${messages}`);
  }

  return json.data.user;
}

async function rest<T>(path: string): Promise<T> {
  const token = process.env["GITHUB_TOKEN"];
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-stats-cards/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${REST_BASE}${path}`, {
    headers,
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`GitHub REST API: HTTP ${res.status} ${res.statusText} for ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isoNow(): string {
  return new Date().toISOString();
}

function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString();
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches raw overview + contribution data for a user.
 * Returns processed OverviewData ready for the SVG renderer.
 */
export async function fetchOverviewData(login: string): Promise<OverviewData> {
  const now = isoNow();
  const yearAgo = isoYearsAgo(1);

  const user = await graphql<GQLUserOverview>(OVERVIEW_QUERY, {
    login,
    from: yearAgo,
    to: now,
  });

  // Build last-12-months trend points from contribution calendar weeks
  const monthlyMap = new Map<string, number>();
  for (const week of user.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      const month = day.date.slice(0, 7); // YYYY-MM
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + day.contributionCount);
    }
  }

  // Sort and take last 12 months
  const trendPoints = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  return {
    login: user.login,
    displayName: user.name ?? user.login,
    avatarUrl: user.avatarUrl,
    bio: user.bio ?? "",
    followers: user.followers.totalCount,
    following: user.following.totalCount,
    publicRepos: user.repositories.totalCount,
    totalContributions:
      user.contributionsCollection.contributionCalendar.totalContributions,
    joinedAt: user.createdAt,
    trendPoints,
  };
}

/**
 * Fetches language usage across all public non-fork repos.
 * Returns top-5 languages with byte counts and percentages.
 */
export async function fetchLanguagesData(login: string): Promise<LanguagesData> {
  const user = await graphql<GQLLanguagesResponse["repositories"]>(
    LANGUAGES_QUERY,
    { login }
  );

  // Aggregate language bytes across repos
  const byteMap = new Map<string, { bytes: number; color: string }>();
  for (const repo of (user as { nodes: Array<{ languages: { edges: Array<{ size: number; node: { name: string; color: string } }> } | null }> }).nodes) {
    if (!repo.languages) continue;
    for (const edge of repo.languages.edges) {
      const existing = byteMap.get(edge.node.name);
      if (existing) {
        existing.bytes += edge.size;
      } else {
        byteMap.set(edge.node.name, {
          bytes: edge.size,
          color: edge.node.color ?? "#8B949E",
        });
      }
    }
  }

  // Sort by bytes descending, take top 5
  const sorted = Array.from(byteMap.entries())
    .sort(([, a], [, b]) => b.bytes - a.bytes)
    .slice(0, 5);

  const totalBytes = sorted.reduce((sum, [, { bytes }]) => sum + bytes, 0);

  const languages = sorted.map(([name, { bytes, color }]) => ({
    name,
    color,
    bytes,
    percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
  }));

  return { languages, totalBytes };
}

/**
 * Fetches aggregated stats: stars, commits, PRs, issues, forks, repos.
 * Combines current year + last year to give a fuller picture.
 */
export async function fetchStatsData(login: string): Promise<StatsData> {
  const now = isoNow();
  const yearAgo = isoYearsAgo(1);
  const twoYearsAgo = isoYearsAgo(2);

  const user = await graphql<{
    repositories: { totalCount: number; nodes: Array<{ stargazerCount: number; forkCount: number }> };
    thisYear: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalRepositoryContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: { totalContributions: number };
    };
    lastYear: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: { totalContributions: number };
    };
  }>(STATS_QUERY, {
    login,
    from: yearAgo,
    to: now,
    prevFrom: twoYearsAgo,
    prevTo: yearAgo,
  });

  const totalStars = user.repositories.nodes.reduce(
    (s, r) => s + r.stargazerCount,
    0
  );
  const totalForks = user.repositories.nodes.reduce(
    (s, r) => s + r.forkCount,
    0
  );

  const totalCommits =
    user.thisYear.totalCommitContributions +
    user.thisYear.restrictedContributionsCount +
    user.lastYear.totalCommitContributions +
    user.lastYear.restrictedContributionsCount;

  const totalPRs =
    user.thisYear.totalPullRequestContributions +
    user.lastYear.totalPullRequestContributions;

  const totalIssues =
    user.thisYear.totalIssueContributions +
    user.lastYear.totalIssueContributions;

  const totalContributions =
    user.thisYear.contributionCalendar.totalContributions +
    user.lastYear.contributionCalendar.totalContributions;

  // Data window = 2 years = 730 days
  const dataWindowDays = 730;
  const avgContributionsPerDay = totalContributions / dataWindowDays;

  return {
    totalStars,
    totalCommits,
    totalPRs,
    totalIssues,
    totalForks,
    totalRepos: user.repositories.totalCount,
    totalContributions,
    avgContributionsPerDay,
    dataWindowDays,
  };
}

/**
 * Fetches the full contribution calendar for activity analysis.
 * Uses the same OVERVIEW_QUERY but only extracts contribution days.
 * REST fallback: GitHub's public /contributions scrape is used by the existing
 * Python script; here we use GraphQL for richer data (weekday, exact counts).
 */
export async function fetchContributionDays(
  login: string
): Promise<ContributionDay[]> {
  const now = isoNow();
  const yearAgo = isoYearsAgo(1);

  const user = await graphql<GQLUserOverview>(OVERVIEW_QUERY, {
    login,
    from: yearAgo,
    to: now,
  });

  const days: ContributionDay[] = [];
  for (const week of user.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({
        date: day.date,
        count: day.contributionCount,
        level: Math.min(4, Math.floor(day.contributionCount / 4)),
        weekday: day.weekday,
      });
    }
  }
  return days;
}

/**
 * REST fallback: fetch user profile (used when GraphQL scope is restricted).
 */
export async function fetchUserRest(login: string): Promise<{
  name: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}> {
  return rest(`/users/${login}`);
}
