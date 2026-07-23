/**
 * lib/github/queries.ts
 *
 * Why it exists: Centralizes all GraphQL query strings so they can be
 * reviewed, edited, and tested independently from the API client.
 * No query strings live anywhere else in the codebase.
 */

/**
 * Overview query: fetches profile info + last-12-months contribution calendar.
 * Uses a $from/$to date range to get exactly one year of data.
 */
export const OVERVIEW_QUERY = /* graphql */ `
  query Overview($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 128)
      bio
      followers { totalCount }
      following { totalCount }
      repositories(
        first: 100
        ownerAffiliations: [OWNER]
        isFork: false
        privacy: PUBLIC
      ) {
        totalCount
        nodes {
          name
          stargazerCount
          forkCount
          primaryLanguage { name color }
          isFork
          isPrivate
        }
      }
      createdAt
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        restrictedContributionsCount
      }
    }
  }
`;

/**
 * Languages query: fetches language breakdown across all public non-fork repos.
 * We request language bytes per repo and aggregate client-side.
 */
export const LANGUAGES_QUERY = /* graphql */ `
  query Languages($login: String!) {
    user(login: $login) {
      repositories(
        first: 100
        ownerAffiliations: [OWNER]
        isFork: false
        privacy: PUBLIC
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node { name color }
            }
          }
        }
      }
    }
  }
`;

/**
 * Stats query: fetches aggregate star/fork counts across repos plus
 * multi-year contribution totals (current year + previous year).
 * Two contributionsCollection calls cover 2 years of commit data.
 */
export const STATS_QUERY = /* graphql */ `
  query Stats($login: String!, $from: DateTime!, $to: DateTime!, $prevFrom: DateTime!, $prevTo: DateTime!) {
    user(login: $login) {
      repositories(
        first: 100
        ownerAffiliations: [OWNER]
        isFork: false
        privacy: PUBLIC
      ) {
        totalCount
        nodes {
          stargazerCount
          forkCount
        }
      }
      thisYear: contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions }
      }
      lastYear: contributionsCollection(from: $prevFrom, to: $prevTo) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions }
      }
    }
  }
`;
