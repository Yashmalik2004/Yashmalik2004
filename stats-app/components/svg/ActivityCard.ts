/**
 * components/svg/ActivityCard.ts
 *
 * Why it exists: Renders Card 4 — Activity.
 * Shows: commits by weekday (left bar chart) + commits by hour (right bar chart).
 * Most productive day and hour are highlighted and labelled.
 *
 * Pure function: (ActivityData) → SVG string.
 */

import { darkTheme as t } from "../../lib/themes/dark";
import { cardShell, escapeXml, WEEKDAY_LABELS } from "../../lib/svg/base";
import { animatedBarChart } from "../../lib/svg/animations";
import { hourLabel } from "../../lib/analytics/activity";
import type { ActivityData } from "../../lib/github/types";

const W = 495;
const H = 230;

export function renderActivityCard(data: ActivityData): string {
  const midX = W / 2;
  const chartY = 70;
  const chartH = 100;
  const chartW = midX - t.cardPadding - 16;

  // Weekday labels (shortened)
  const wdLabels = WEEKDAY_LABELS.map((d) => d.slice(0, 2));

  // Hour labels: show every 3rd
  const hourLabels = Array.from({ length: 24 }, (_, i) =>
    i % 3 === 0 ? hourLabel(i) : ""
  );

  // Highlight indices
  const maxWdIdx = data.commitsByWeekday.reduce(
    (best, v, i) => (v > (data.commitsByWeekday[best] ?? 0) ? i : best),
    0
  );
  const maxHrIdx = data.commitsByHour.reduce(
    (best, v, i) => (v > (data.commitsByHour[best] ?? 0) ? i : best),
    0
  );

  const inner = `
    <!-- Section header: Weekday -->
    <text x="${t.cardPadding}" y="68"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeSm}"
      font-weight="600"
      fill="${t.textSecondary}"
      class="fade-in-d1">By Weekday</text>

    <!-- Weekday bar chart -->
    ${animatedBarChart({
      x: t.cardPadding,
      y: chartY + 8,
      width: chartW,
      height: chartH,
      values: data.commitsByWeekday,
      labels: wdLabels,
      color: t.accentBlue,
      highlightIndex: maxWdIdx,
      animDelay: "0.2",
    })}

    <!-- Divider -->
    <line x1="${midX}" y1="62" x2="${midX}" y2="${chartY + chartH + 24}"
      stroke="${t.borderColor}" stroke-width="1" opacity="0.4"/>

    <!-- Section header: Hour -->
    <text x="${midX + 16}" y="68"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeSm}"
      font-weight="600"
      fill="${t.textSecondary}"
      class="fade-in-d1">By Hour of Day</text>

    <!-- Hour bar chart -->
    ${animatedBarChart({
      x: midX + 16,
      y: chartY + 8,
      width: chartW - 8,
      height: chartH,
      values: data.commitsByHour,
      labels: hourLabels,
      color: t.accentPurple,
      highlightIndex: maxHrIdx,
      animDelay: "0.3",
    })}

    <!-- Most productive summary row -->
    <g class="fade-in-d4">
      <rect x="${t.cardPadding}" y="${H - 40}" width="${W - t.cardPadding * 2}" height="24"
        rx="6" fill="${t.bgCardAlt}"/>
      <text x="${t.cardPadding + 10}" y="${H - 23}"
        font-family="${t.fontFamily}"
        font-size="${t.fontSizeSm}"
        fill="${t.textSecondary}">
        🏆 Most active: <tspan fill="${t.accentOrange}" font-weight="700">${escapeXml(data.mostProductiveDay)}</tspan>
        &nbsp;·&nbsp;
        Peak hour: <tspan fill="${t.accentPurple}" font-weight="700">${escapeXml(hourLabel(data.mostProductiveHour))}</tspan>
        &nbsp;·&nbsp;
        <tspan fill="${t.textMuted}">${data.totalAnalyzed.toLocaleString()} contributions analyzed</tspan>
      </text>
    </g>
  `;

  return cardShell({ width: W, height: H, title: "Activity" }, inner);
}
