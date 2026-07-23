/**
 * components/svg/LanguagesCard.ts
 *
 * Why it exists: Renders Card 2 — Top Languages.
 * Shows: animated donut chart on the left, language list with progress bars on the right.
 *
 * Pure function: (LanguagesData) → SVG string.
 */

import { darkTheme as t } from "../../lib/themes/dark";
import { cardShell, escapeXml, truncate } from "../../lib/svg/base";
import { animatedDonut, animatedProgressBar } from "../../lib/svg/animations";
import type { LanguagesData } from "../../lib/github/types";

const W = 495;
const H = 220;

export function renderLanguagesCard(data: LanguagesData): string {
  if (data.languages.length === 0) {
    return renderEmpty();
  }

  const donutCx = 95;
  const donutCy = 120;
  const donutR = 58;
  const listX = 185;

  // Build donut segments
  const segments = data.languages.map((l) => ({
    percentage: l.percentage,
    color: l.color,
    label: l.name,
  }));

  const inner = `
    <!-- Donut chart -->
    ${animatedDonut({
      cx: donutCx,
      cy: donutCy,
      radius: donutR,
      thickness: 14,
      segments,
    })}

    <!-- Center label in donut -->
    <text x="${donutCx}" y="${donutCy - 6}"
      text-anchor="middle"
      font-family="${t.fontMono}"
      font-size="${t.fontSizeXs}"
      fill="${t.textSecondary}"
      class="fade-in-d3">Top</text>
    <text x="${donutCx}" y="${donutCy + 10}"
      text-anchor="middle"
      font-family="${t.fontMono}"
      font-size="${t.fontSizeLg}"
      font-weight="700"
      fill="${t.textPrimary}"
      class="fade-in-d3">${data.languages.length}</text>
    <text x="${donutCx}" y="${donutCy + 24}"
      text-anchor="middle"
      font-family="${t.fontMono}"
      font-size="${t.fontSizeXs}"
      fill="${t.textSecondary}"
      class="fade-in-d3">langs</text>

    <!-- Language list with progress bars -->
    ${data.languages.map((lang, i) => {
      const ly = 68 + i * 30;
      const delay = (0.2 + i * 0.1).toFixed(1);
      const barW = W - listX - t.cardPadding - 60;

      return `<g style="animation: fadeIn 0.5s ${delay}s ease both; opacity: 0;">
        <!-- Color dot -->
        <circle cx="${listX}" cy="${ly - 4}" r="5" fill="${lang.color}"/>

        <!-- Language name -->
        <text x="${listX + 14}" y="${ly}"
          font-family="${t.fontFamily}"
          font-size="${t.fontSizeMd}"
          font-weight="600"
          fill="${t.textPrimary}">${escapeXml(truncate(lang.name, 14))}</text>

        <!-- Progress bar -->
        ${animatedProgressBar({
          x: listX + 14,
          y: ly + 6,
          width: barW,
          height: 5,
          percentage: lang.percentage,
          color: lang.color,
          bgColor: t.bgCardAlt,
          animDelay: `${delay}s`,
          radius: 3,
        })}
      </g>`;
    }).join("\n    ")}
  `;

  return cardShell({ width: W, height: H, title: "Top Languages" }, inner);
}

function renderEmpty(): string {
  const inner = `
    <text x="${W / 2}" y="${H / 2}"
      text-anchor="middle"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeMd}"
      fill="${t.textSecondary}">No public language data available</text>
  `;
  return cardShell({ width: W, height: H, title: "Top Languages" }, inner);
}
