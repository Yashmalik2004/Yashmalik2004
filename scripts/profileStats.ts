/**
 * scripts/profileStats.ts
 *
 * Responsibility: Fetch all data needed for the Profile Summary card.
 *   - Stars, forks, commits, PRs, issues (2-year window)
 *   - Top languages by bytes across all public repos
 *   - Followers, following, public repos
 *   - Account age in years
 *
 * Returns: ProfileData (clean typed object, no SVG)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LanguageEntry {
  name: string;
  color: string;
  percentage: number; // 0–100
}

export interface ProfileData {
  login: string;
  totalStars: number;
  totalForks: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalRepos: number;
  followers: number;
  following: number;
  /** Account age in full years */
  accountAgeYears: number;
  /** Joined year e.g. "2022" */
  joinedYear: string;
  /** Top 5 languages with percentages summing to 100 */
  topLanguages: LanguageEntry[];
  /** Contributions in the last 365 days */
  contributionsThisYear: number;
  fetchedAt: string;
}

// ─── GraphQL endpoint ─────────────────────────────────────────────────────────

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

// ─── Queries ──────────────────────────────────────────────────────────────────

const PROFILE_QUERY = /* graphql */ `
  query Profile(
    $login: String!
    $from: DateTime!
    $to: DateTime!
    $prevFrom: DateTime!
    $prevTo: DateTime!
  ) {
    user(login: $login) {
      login
      createdAt
      followers { totalCount }
      following  { totalCount }

      repositories(
        first: 100
        ownerAffiliations: [OWNER]
        isFork: false
        privacy: PUBLIC
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          stargazerCount
          forkCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node { name color }
            }
          }
        }
      }

      thisYear: contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions }
      }

      lastYear: contributionsCollection(from: $prevFrom, to: $prevTo) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        restrictedContributionsCount
      }
    }
  }
`;

// ─── Internal fetch ───────────────────────────────────────────────────────────

interface GQLResponse<T> {
  data: { user: T };
  errors?: Array<{ message: string }>;
}

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) throw new Error("GITHUB_TOKEN is not set");

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-summary-card/1.0",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 401) throw new Error("GitHub API 401 — token invalid");
  if (res.status === 403) throw new Error("GitHub API 403 — rate limited");
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);

  const json = (await res.json()) as GQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  return json.data.user;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function nowISO(): string { return new Date().toISOString(); }
function yearsAgoISO(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString();
}

// ─── Language aggregation ─────────────────────────────────────────────────────

interface RepoNode {
  stargazerCount: number;
  forkCount: number;
  languages: {
    edges: Array<{ size: number; node: { name: string; color: string } }>;
  } | null;
}

function aggregateLanguages(repos: RepoNode[]): LanguageEntry[] {
  const map = new Map<string, { bytes: number; color: string }>();

  for (const repo of repos) {
    if (!repo.languages?.edges) continue;
    for (const edge of repo.languages.edges) {
      const existing = map.get(edge.node.name);
      if (existing) {
        existing.bytes += edge.size;
      } else {
        map.set(edge.node.name, {
          bytes: edge.size,
          color: edge.node.color ?? "#8B949E",
        });
      }
    }
  }

  const sorted = Array.from(map.entries())
    .sort(([, a], [, b]) => b.bytes - a.bytes)
    .slice(0, 5);

  const total = sorted.reduce((s, [, { bytes }]) => s + bytes, 0);

  return sorted.map(([name, { color, bytes }]) => ({
    name,
    color,
    percentage: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchProfileData(login: string): Promise<ProfileData> {
  const to        = nowISO();
  const from      = yearsAgoISO(1);
  const prevFrom  = yearsAgoISO(2);

  const user = await graphql<{
    login: string;
    createdAt: string;
    followers: { totalCount: number };
    following:  { totalCount: number };
    repositories: { totalCount: number; nodes: RepoNode[] };
    thisYear: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: { totalContributions: number };
    };
    lastYear: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      restrictedContributionsCount: number;
    };
  }>(PROFILE_QUERY, { login, from, to, prevFrom, prevTo: from });

  const repos = user.repositories.nodes;

  const totalStars  = repos.reduce((s, r) => s + r.stargazerCount, 0);
  const totalForks  = repos.reduce((s, r) => s + r.forkCount, 0);

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

  const joinedDate = new Date(user.createdAt);
  const nowDate    = new Date();
  const accountAgeYears = Math.floor(
    (nowDate.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  return {
    login: user.login,
    totalStars,
    totalForks,
    totalCommits,
    totalPRs,
    totalIssues,
    totalRepos: user.repositories.totalCount,
    followers: user.followers.totalCount,
    following:  user.following.totalCount,
    accountAgeYears,
    joinedYear: joinedDate.getFullYear().toString(),
    topLanguages: aggregateLanguages(repos),
    contributionsThisYear: user.thisYear.contributionCalendar.totalContributions,
    fetchedAt: new Date().toISOString(),
  };
}
