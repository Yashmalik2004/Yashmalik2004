/**
 * components/svg/StatsCard.ts
 *
 * Why it exists: Renders Card 3 — GitHub Stats.
 * Shows: Stars, Commits, PRs, Issues, Forks, Repos, Avg contributions/day.
 * All values animate in with staggered fade-in (counter animation via CSS).
 *
 * Pure function: (StatsData) → SVG string.
 */

import { darkTheme as t } from "../../lib/themes/dark";
import { cardShell, escapeXml, formatNumber } from "../../lib/svg/base";
import { formatStat } from "../../lib/analytics/stats";
import type { StatsData } from "../../lib/github/types";

const W = 495;
const H = 200;

interface StatDef {
  icon: string;
  label: string;
  value: string;
  color: string;
}

export function renderStatsCard(data: StatsData): string {
  const stats: StatDef[] = [
    { icon: "⭐", label: "Stars Earned",     value: formatNumber(data.totalStars),        color: t.accentYellow },
    { icon: "📝", label: "Total Commits",    value: formatStat(data.totalCommits),         color: t.accentBlue   },
    { icon: "🔀", label: "Pull Requests",    value: formatStat(data.totalPRs),             color: t.accentPurple },
    { icon: "🐛", label: "Issues Opened",    value: formatStat(data.totalIssues),           color: t.accentRed    },
    { icon: "🍴", label: "Total Forks",      value: formatStat(data.totalForks),            color: t.accentOrange },
    { icon: "📦", label: "Repositories",     value: formatStat(data.totalRepos),            color: t.accentGreen  },
    { icon: "📊", label: "Avg / Day",        value: formatStat(data.avgContributionsPerDay, true), color: t.accentTeal },
  ];

  // Layout: 4 on top row, 3 on bottom row
  const topRow = stats.slice(0, 4);
  const bottomRow = stats.slice(4);

  const inner = `
    ${renderRow(topRow, 0, 72)}
    ${renderRow(bottomRow, 0, 145)}
  `;

  return cardShell({ width: W, height: H, title: "GitHub Stats" }, inner);
}

function renderRow(items: StatDef[], _rowIndex: number, baseY: number): string {
  const colW = (W - t.cardPadding * 2) / 4;
  return items.map((item, i) => {
    const x = t.cardPadding + i * colW;
    const delay = (0.1 + i * 0.12).toFixed(2);

    return `<g style="animation: fadeIn 0.6s ${delay}s ease both; opacity: 0;">
      <!-- Icon background pill -->
      <rect x="${x + 2}" y="${baseY - 18}" width="32" height="20"
        rx="5" fill="${item.color}" opacity="0.15"/>
      <text x="${x + 8}" y="${baseY - 3}"
        font-family="${t.fontFamily}"
        font-size="13">${escapeXml(item.icon)}</text>

      <!-- Value (large, monospace) -->
      <text x="${x + 4}" y="${baseY + 22}"
        font-family="${t.fontMono}"
        font-size="${t.fontSizeXl}"
        font-weight="700"
        fill="${item.color}">${escapeXml(item.value)}</text>

      <!-- Label -->
      <text x="${x + 4}" y="${baseY + 38}"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeSm}"
        fill="${t.textSecondary}">${escapeXml(item.label)}</text>
    </g>`;
  }).join("\n    ");
}
