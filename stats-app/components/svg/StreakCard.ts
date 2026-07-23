/**
 * components/svg/StreakCard.ts
 *
 * Why it exists: Renders Card 6 — Streak.
 * Shows: current streak, longest streak, animated progress bar, fire icon animation,
 * streak date ranges, and total active days.
 *
 * Streak is computed locally from contribution data — no third-party API.
 * Pure function: (StreakData) → SVG string.
 */

import { darkTheme as t } from "../../lib/themes/dark";
import { cardShell, escapeXml, formatNumber } from "../../lib/svg/base";
import { fireIcon, animatedProgressBar, animatedCounter } from "../../lib/svg/animations";
import { formatStreakRange } from "../../lib/analytics/streak";
import type { StreakData } from "../../lib/github/types";

const W = 495;
const H = 215;

export function renderStreakCard(data: StreakData): string {
  const midX = W / 2;

  // Progress: how close current streak is to longest
  const progressPct =
    data.longestStreak > 0
      ? Math.min(100, (data.currentStreak / data.longestStreak) * 100)
      : 0;

  const inner = `
    <!-- Current streak section (left) -->
    <g class="fade-in-d1">
      <!-- Fire icon -->
      ${fireIcon(t.cardPadding, 58, 32)}

      <text x="${t.cardPadding + 40}" y="76"
        font-family="${t.fontMono}"
        font-size="32"
        font-weight="700"
        fill="${t.accentOrange}">${data.currentStreak}</text>

      <text x="${t.cardPadding + 40}" y="96"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeMd}"
        fill="${t.textSecondary}">day current streak</text>

      <text x="${t.cardPadding + 40}" y="116"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeSm}"
        fill="${t.textMuted}">${escapeXml(formatStreakRange(data.currentStreakStart, data.currentStreakEnd))}</text>
    </g>

    <!-- Vertical divider -->
    <line x1="${midX}" y1="62" x2="${midX}" y2="140"
      stroke="${t.borderColor}" stroke-width="1" opacity="0.4"/>

    <!-- Longest streak section (right) -->
    <g class="fade-in-d2">
      <text x="${midX + 20}" y="78"
        font-family="${t.fontMono}"
        font-size="32"
        font-weight="700"
        fill="${t.accentYellow}">${data.longestStreak}</text>

      <text x="${midX + 20}" y="97"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeMd}"
        fill="${t.textSecondary}">day longest streak</text>

      <text x="${midX + 20}" y="116"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeSm}"
        fill="${t.textMuted}">${escapeXml(formatStreakRange(data.longestStreakStart, data.longestStreakEnd))}</text>
    </g>

    <!-- Section divider -->
    <line x1="${t.cardPadding}" y1="148" x2="${W - t.cardPadding}" y2="148"
      stroke="${t.borderColor}" stroke-width="1" opacity="0.3"
      class="fade-in-d3"/>

    <!-- Progress label -->
    <text x="${t.cardPadding}" y="168"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeSm}"
      fill="${t.textSecondary}"
      class="fade-in-d3">
      Progress to record &nbsp;
      <tspan fill="${t.accentOrange}" font-weight="600">${data.currentStreak}</tspan>
      <tspan fill="${t.textMuted}"> / </tspan>
      <tspan fill="${t.accentYellow}" font-weight="600">${data.longestStreak}</tspan>
      <tspan fill="${t.textMuted}"> days</tspan>
    </text>

    <!-- Animated progress bar -->
    ${animatedProgressBar({
      x: t.cardPadding,
      y: 174,
      width: W - t.cardPadding * 2 - 60,
      height: 10,
      percentage: progressPct,
      color: "url(#fireGrad)",
      animDelay: "0.4s",
      radius: 5,
    })}

    <!-- Total active days badge -->
    <g class="fade-in-d4">
      <rect x="${W - t.cardPadding - 100}" y="${H - 36}" width="96" height="20"
        rx="5" fill="${t.bgCardAlt}"/>
      <text x="${W - t.cardPadding - 52}" y="${H - 22}"
        text-anchor="middle"
        font-family="${t.fontMono}"
        font-size="${t.fontSizeSm}"
        fill="${t.textSecondary}">
        🗓 ${formatNumber(data.totalActiveDays)} active days
      </text>
    </g>
  `;

  return cardShell({ width: W, height: H, title: "🔥 Contribution Streak" }, inner);
}

// Ensure import is used
export { animatedCounter };
