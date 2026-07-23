/**
 * lib/github/types.ts
 *
 * Why it exists: Central TypeScript type definitions for all GitHub API responses
 * and the processed data shapes passed between layers. Strict types prevent runtime
 * surprises and make analytics functions fully type-safe.
 */

// ─── Raw GraphQL Shapes ──────────────────────────────────────────────────────

export interface GQLUserOverview {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: { totalCount: number };
  following: { totalCount: number };
  repositories: {
    totalCount: number;
    nodes: GQLRepository[];
  };
  createdAt: string; // ISO date
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: GQLContributionWeek[];
    };
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalIssueContributions: number;
    restrictedContributionsCount: number;
  };
}

export interface GQLRepository {
  name: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
  isFork: boolean;
  isPrivate: boolean;
}

export interface GQLContributionWeek {
  contributionDays: GQLContributionDay[];
}

export interface GQLContributionDay {
  date: string; // YYYY-MM-DD
  contributionCount: number;
  weekday: number; // 0 = Sun
}

export interface GQLLanguageEdge {
  size: number;
  node: { name: string; color: string };
}

export interface GQLLanguagesResponse {
  repositories: {
    nodes: Array<{
      languages: {
        edges: GQLLanguageEdge[];
      } | null;
    }>;
  };
}

// ─── Processed / Analytics Shapes ────────────────────────────────────────────

/** A single contribution day from data/contributions.json or GraphQL */
export interface ContributionDay {
  date: string;          // YYYY-MM-DD
  count: number;
  level: number;         // 0–4
  weekday?: number;      // 0=Sun … 6=Sat
}

/** Streak calculation result */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  /** Start date of the current streak */
  currentStreakStart: string;
  /** End date of the current streak (most recent active day) */
  currentStreakEnd: string;
  /** Start date of the longest streak */
  longestStreakStart: string;
  /** End date of the longest streak */
  longestStreakEnd: string;
  /** Total active contribution days in the dataset */
  totalActiveDays: number;
}

/** One language entry with percentage */
export interface LanguageEntry {
  name: string;
  color: string;
  bytes: number;
  percentage: number;
}

/** Top-5 languages result */
export interface LanguagesData {
  languages: LanguageEntry[];
  totalBytes: number;
}

/** Aggregated GitHub stats */
export interface StatsData {
  totalStars: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalForks: number;
  totalRepos: number;
  totalContributions: number;
  /** Contributions per day averaged over the dataset window */
  avgContributionsPerDay: number;
  /** Days in the dataset window */
  dataWindowDays: number;
}

/** Activity analysis result */
export interface ActivityData {
  commitsByWeekday: number[]; // index 0=Sun … 6=Sat
  commitsByHour: number[];    // index 0–23
  mostProductiveDay: string;  // e.g. "Wednesday"
  mostProductiveHour: number; // 0–23
  /** Total contributions included in analysis */
  totalAnalyzed: number;
}

/** Overview card data (combines multiple sources) */
export interface OverviewData {
  login: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  publicRepos: number;
  totalContributions: number;
  joinedAt: string;           // ISO date
  /** Last 12 months of monthly contribution totals: [{month, count}] */
  trendPoints: Array<{ month: string; count: number }>;
}
