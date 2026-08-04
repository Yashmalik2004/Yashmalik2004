/**
 * scripts/githubStats.ts
 *
 * Responsibility: GitHub GraphQL client.
 *   - Authentication via GITHUB_TOKEN env var
 *   - Fetches the full contribution calendar (1 year of data)
 *   - Returns clean, typed objects
 *   - No SVG code, no streak calculations
 *
 * Designed to be the shared data layer for any future card generators.
 * All downstream modules import from here; no module calls fetch directly.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single raw contribution day as returned by the GraphQL API */
export interface GQLContributionDay {
  date: string;              // YYYY-MM-DD
  contributionCount: number;
  contributionLevel: string; // "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE"
  weekday: number;           // 0 = Sunday, 6 = Saturday
}

/** A single week (7 days) from the contribution calendar */
export interface GQLContributionWeek {
  contributionDays: GQLContributionDay[];
}

/** The full contribution calendar as returned by GitHub GraphQL */
export interface GQLContributionCalendar {
  totalContributions: number;
  weeks: GQLContributionWeek[];
}

/** The top-level user node returned by our CONTRIBUTION_STREAK_QUERY */
export interface GQLStreakUser {
  contributionsCollection: {
    contributionCalendar: GQLContributionCalendar;
  };
}

/**
 * The clean, processed contribution data this module returns.
 * Everything downstream should consume this shape.
 */
export interface ContributionData {
  /** The raw calendar from GitHub — weeks → days */
  calendar: GQLContributionCalendar;
  /** Flat array of all contribution days, sorted oldest → newest */
  days: GQLContributionDay[];
  /** Total contributions across the fetched period */
  totalContributions: number;
  /** ISO timestamp of when this data was fetched */
  fetchedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

// ─── GraphQL Query ────────────────────────────────────────────────────────────

/**
 * Fetches the last-12-months contribution calendar with all fields needed
 * for streak calculations and the intensity strip visualization.
 *
 * We request contributionLevel (NONE/FIRST_QUARTILE/…) in addition to
 * contributionCount so the SVG renderer can map intensity without re-computing
 * quartile thresholds from scratch.
 */
const CONTRIBUTION_STREAK_QUERY = /* graphql */ `
  query ContributionStreak($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              weekday
            }
          }
        }
      }
    }
  }
`;

// ─── Internal fetch helper ─────────────────────────────────────────────────

interface GraphQLResponse<T> {
  data: { user: T };
  errors?: Array<{ message: string; type?: string }>;
}

/**
 * Sends a GraphQL request to the GitHub API and returns the typed payload.
 * Throws descriptive errors for auth failures, rate limits, and GraphQL errors.
 */
async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is not set. " +
      "Export it before running: export GITHUB_TOKEN=ghp_..."
    );
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-stats-card/1.0 (static SVG generator)",
    },
    body: JSON.stringify({ query, variables }),
  });

  // Surface auth / rate-limit problems with clear messages
  if (response.status === 401) {
    throw new Error(
      "GitHub API: 401 Unauthorized. Your GITHUB_TOKEN may be expired or invalid."
    );
  }
  if (response.status === 403) {
    const remaining = response.headers.get("x-ratelimit-remaining") ?? "unknown";
    const reset = response.headers.get("x-ratelimit-reset");
    const resetTime = reset
      ? new Date(parseInt(reset, 10) * 1000).toISOString()
      : "unknown";
    throw new Error(
      `GitHub API: 403 Rate limited. Remaining: ${remaining}. Resets at: ${resetTime}`
    );
  }
  if (!response.ok) {
    throw new Error(
      `GitHub API: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  // GraphQL can return HTTP 200 with errors in the payload
  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join("; ");
    throw new Error(`GitHub GraphQL errors: ${messages}`);
  }

  return json.data.user;
}

// ─── Date helpers ──────────────────────────────────────────────────────────

/** Returns the current UTC time as an ISO-8601 string */
function nowISO(): string {
  return new Date().toISOString();
}

/** Returns a date N years before now as an ISO-8601 string */
function yearsAgoISO(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString();
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Fetches the full contribution calendar for the given GitHub username.
 *
 * By default fetches the last 12 months (1 year back from today).
 * Pass `yearsBack: 2` if you want a two-year streak window.
 *
 * @param login    - GitHub username, e.g. "Yashmalik2004"
 * @param yearsBack - How many years of history to fetch (default: 1)
 */
export async function fetchContributionData(
  login: string,
  yearsBack = 1
): Promise<ContributionData> {
  const to = nowISO();
  const from = yearsAgoISO(yearsBack);

  const user = await githubGraphQL<GQLStreakUser>(CONTRIBUTION_STREAK_QUERY, {
    login,
    from,
    to,
  });

  const calendar = user.contributionsCollection.contributionCalendar;

  // Flatten weeks → days into a single sorted array (oldest first)
  const days: GQLContributionDay[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      days.push(day);
    }
  }

  return {
    calendar,
    days,
    totalContributions: calendar.totalContributions,
    fetchedAt: new Date().toISOString(),
  };
}
