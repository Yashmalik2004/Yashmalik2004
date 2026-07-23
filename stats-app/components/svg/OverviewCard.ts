/**
 * components/svg/OverviewCard.ts
 *
 * Why it exists: Renders Card 1 — the hero overview card.
 * Contains: avatar, display name, username, bio, followers/following,
 * public repos, total contributions, joined date, and a 12-month trend line.
 *
 * Pure function: (OverviewData) → SVG string. No side effects.
 */

import { darkTheme as t } from "../../lib/themes/dark";
import { cardShell, escapeXml, formatNumber, truncate } from "../../lib/svg/base";
import { animatedTrendLine, trendMonthLabels, animatedCounter } from "../../lib/svg/animations";
import type { OverviewData } from "../../lib/github/types";

const W = 495;
const H = 290;

export function renderOverviewCard(data: OverviewData): string {
  const trendValues = data.trendPoints.map((p) => p.count);
  const trendMonths = data.trendPoints.map((p) => p.month);

  const inner = `
    <!-- Avatar circle -->
    <g class="fade-in">
      <clipPath id="avatar-clip">
        <circle cx="44" cy="88" r="30"/>
      </clipPath>
      <circle cx="44" cy="88" r="31"
        fill="none" stroke="${t.borderColor}" stroke-width="1.5"/>
      <image href="${escapeXml(data.avatarUrl)}" x="14" y="58"
        width="60" height="60"
        clip-path="url(#avatar-clip)"
        preserveAspectRatio="xMidYMid slice"/>
    </g>

    <!-- Name + username -->
    <g class="fade-in-d1">
      <text x="86" y="80"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeXl}"
        font-weight="700"
        fill="${t.textPrimary}">${escapeXml(truncate(data.displayName, 22))}</text>
      <text x="86" y="98"
        font-family="${t.fontMono}"
        font-size="${t.fontSizeMd}"
        fill="${t.accentBlue}">@${escapeXml(data.login)}</text>
    </g>

    <!-- Bio -->
    ${data.bio ? `
    <text x="${t.cardPadding}" y="135"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeSm}"
      fill="${t.textSecondary}"
      class="fade-in-d2">${escapeXml(truncate(data.bio, 72))}</text>` : ""}

    <!-- Divider -->
    <line x1="${t.cardPadding}" y1="148" x2="${W - t.cardPadding}" y2="148"
      stroke="${t.borderColor}" stroke-width="1" opacity="0.4"
      class="fade-in-d2"/>

    <!-- Stats row: followers / following / repos / joined -->
    <g class="fade-in-d3">
      ${statsRow(data)}
    </g>

    <!-- Trend label -->
    <text x="${t.cardPadding}" y="183"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeSm}"
      font-weight="600"
      fill="${t.textSecondary}"
      class="fade-in-d3">
      12-month contributions · ${animatedCountStr(data.totalContributions)} total
    </text>

    <!-- Trend line chart -->
    ${animatedTrendLine({
      x: t.cardPadding,
      y: 190,
      width: W - t.cardPadding * 2,
      height: 50,
      points: trendValues,
      animDelay: "0.5s",
    })}

    <!-- Month labels -->
    ${trendMonthLabels(t.cardPadding, 258, W - t.cardPadding * 2, trendMonths)}
  `;

  return cardShell({ width: W, height: H, title: "GitHub Overview" }, inner);
}

function statsRow(data: OverviewData): string {
  const items = [
    { label: "followers", value: formatNumber(data.followers), icon: "👥" },
    { label: "following", value: formatNumber(data.following), icon: "➡️" },
    { label: "repositories", value: formatNumber(data.publicRepos), icon: "📦" },
    { label: "since", value: new Date(data.joinedAt).getUTCFullYear().toString(), icon: "📅" },
  ];

  const colW = (W - t.cardPadding * 2) / items.length;

  return items.map((item, i) => {
    const x = t.cardPadding + i * colW;
    return `
      <text x="${x + colW / 2}" y="162"
        text-anchor="middle"
        font-family="${t.fontMono}"
        font-size="${t.fontSizeLg}"
        font-weight="700"
        fill="${t.textPrimary}">${escapeXml(item.value)}</text>
      <text x="${x + colW / 2}" y="176"
        text-anchor="middle"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeXs}"
        fill="${t.textSecondary}">${escapeXml(item.label)}</text>
    `;
  }).join("");
}

function animatedCountStr(n: number): string {
  return formatNumber(n);
}

// unused but exported so import resolves
export { animatedCounter };
