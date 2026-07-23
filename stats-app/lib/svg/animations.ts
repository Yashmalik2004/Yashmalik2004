/**
 * lib/svg/animations.ts
 *
 * Why it exists: Reusable animated SVG sub-components used across cards.
 * Keeps animation logic (paths, keyframes, timing) in one place so
 * individual card renderers stay focused on layout.
 *
 * All functions accept data + geometry params and return SVG string fragments.
 */

import { darkTheme as t } from "../themes/dark";
import { escapeXml, monthLabel, WEEKDAY_LABELS } from "./base";

// ─── Animated counter text ────────────────────────────────────────────────────

interface CounterTextOpts {
  x: number;
  y: number;
  value: string;
  fontSize?: number;
  fontWeight?: string;
  fill?: string;
  animDelay?: string;
  anchor?: "start" | "middle" | "end";
}

/**
 * Renders a number text with a CSS counter-up animation.
 * The animation uses @keyframes countUp (defined in base.ts shared styles).
 */
export function animatedCounter(opts: CounterTextOpts): string {
  const {
    x, y, value,
    fontSize = t.fontSizeXl,
    fontWeight = "700",
    fill = t.textPrimary,
    animDelay = "0s",
    anchor = "start",
  } = opts;

  return `<text x="${x}" y="${y}"
    font-family="${t.fontMono}"
    font-size="${fontSize}"
    font-weight="${fontWeight}"
    fill="${fill}"
    text-anchor="${anchor}"
    style="animation: fadeIn 0.8s ${animDelay} ease both; opacity: 0;">
    ${escapeXml(value)}
  </text>`;
}

// ─── SVG line-draw (trend line) ───────────────────────────────────────────────

interface TrendLineOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  points: number[];    // raw values (will be normalized)
  animDelay?: string;
}

/**
 * Renders an animated SVG polyline that "draws" itself from left to right.
 * Used for the 12-month contribution trend in the overview card.
 */
export function animatedTrendLine(opts: TrendLineOpts): string {
  const { x, y, width, height, points, animDelay = "0.4s" } = opts;
  if (points.length < 2) return "";

  const max = Math.max(...points, 1);
  const step = width / (points.length - 1);

  // Map each point to SVG coordinates
  const coords = points.map((v, i) => {
    const px = x + i * step;
    const py = y + height - (v / max) * height;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(" L ")}`;

  // Area fill path (close to bottom)
  const areaCoords = [
    `${x},${y + height}`,
    ...coords,
    `${x + width},${y + height}`,
  ];
  const areaD = `M ${areaCoords.join(" L ")} Z`;

  return `<g>
    <!-- Area fill -->
    <path d="${areaD}" fill="${t.accentBlue}" opacity="0.12"/>

    <!-- Trend line with draw animation -->
    <path d="${pathD}"
      fill="none"
      stroke="${t.accentBlue}"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="1000"
      stroke-dashoffset="1000"
      style="animation: drawLine 1.5s ${animDelay} ${t.animEasing} forwards;"/>

    <!-- Data point dots -->
    ${coords.map((c, i) => {
      const [px, py] = c.split(",");
      return `<circle cx="${px}" cy="${py}" r="3"
        fill="${t.accentBlue}"
        style="animation: fadeIn 0.4s ${(parseFloat(animDelay) + 0.8 + i * 0.05).toFixed(2)}s ease both; opacity: 0;"/>`;
    }).join("\n    ")}
  </g>`;
}

// ─── Animated bar chart ───────────────────────────────────────────────────────

interface BarChartOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  values: number[];
  labels: string[];
  color?: string;
  highlightIndex?: number;   // index of bar to highlight in accent color
  animDelay?: string;
}

/**
 * Renders an animated vertical bar chart.
 * Bars grow from bottom to top (scaleY animation with transform-origin bottom).
 */
export function animatedBarChart(opts: BarChartOpts): string {
  const {
    x, y, width, height, values, labels,
    color = t.accentBlue,
    highlightIndex = -1,
    animDelay = "0.2s",
  } = opts;

  if (values.length === 0) return "";

  const max = Math.max(...values, 1);
  const barWidth = Math.floor(width / values.length) - 2;

  return `<g>
    ${values.map((v, i) => {
      const barH = Math.max(2, Math.round((v / max) * height));
      const bx = x + i * (barWidth + 2);
      const by = y + height - barH;
      const isHighlight = i === highlightIndex;
      const fill = isHighlight ? t.accentOrange : color;
      const delay = (parseFloat(animDelay) + i * 0.04).toFixed(2);

      return `<g>
        <rect x="${bx}" y="${by}" width="${barWidth}" height="${barH}"
          rx="${t.borderRadiusXs}"
          fill="${fill}"
          opacity="${isHighlight ? "1" : "0.75"}"
          style="transform-origin: ${bx + barWidth / 2}px ${y + height}px;
                 animation: growBar ${t.animBarDuration} ${delay}s ${t.animEasing} both;"/>
        <text x="${bx + barWidth / 2}" y="${y + height + 14}"
          text-anchor="middle"
          font-family="${t.fontFamily}"
          font-size="${t.fontSizeXs}"
          fill="${t.textMuted}">${escapeXml(labels[i] ?? "")}</text>
      </g>`;
    }).join("\n    ")}
  </g>`;
}

// ─── Animated donut chart ─────────────────────────────────────────────────────

interface DonutSegment {
  percentage: number;
  color: string;
  label: string;
}

interface DonutChartOpts {
  cx: number;
  cy: number;
  radius?: number;
  thickness?: number;
  segments: DonutSegment[];
}

/**
 * Renders an animated donut (ring) chart.
 * Each segment animates its stroke-dashoffset from the full circumference to 0.
 */
export function animatedDonut(opts: DonutChartOpts): string {
  const { cx, cy, radius = 60, thickness = 14, segments } = opts;
  const circumference = 2 * Math.PI * radius;

  let offset = 0; // current rotation offset in degrees
  const parts: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    const dashLength = (seg.percentage / 100) * circumference;
    const gapLength = circumference - dashLength;
    const delay = (0.3 + i * 0.15).toFixed(2);
    const rotation = offset - 90; // start from top

    parts.push(`<circle
      cx="${cx}" cy="${cy}"
      r="${radius}"
      fill="none"
      stroke="${seg.color}"
      stroke-width="${thickness}"
      stroke-linecap="butt"
      stroke-dasharray="${dashLength.toFixed(2)} ${gapLength.toFixed(2)}"
      transform="rotate(${rotation} ${cx} ${cy})"
      style="animation: fadeIn 0.6s ${delay}s ease both; opacity: 0;"
      />`);

    offset += (seg.percentage / 100) * 360;
  }

  return `<g>
    <!-- Donut background ring -->
    <circle cx="${cx}" cy="${cy}" r="${radius}"
      fill="none" stroke="${t.borderColor}" stroke-width="${thickness}"/>

    <!-- Segments -->
    ${parts.join("\n    ")}

    <!-- Center hole -->
    <circle cx="${cx}" cy="${cy}"
      r="${radius - thickness - 4}"
      fill="${t.bgCard}"/>
  </g>`;
}

// ─── Animated progress bar ────────────────────────────────────────────────────

interface ProgressBarOpts {
  x: number;
  y: number;
  width: number;
  height?: number;
  percentage: number;   // 0–100
  color?: string;
  bgColor?: string;
  animDelay?: string;
  radius?: number;
}

/**
 * Renders an animated horizontal progress bar.
 * The fill grows from left to right.
 */
export function animatedProgressBar(opts: ProgressBarOpts): string {
  const {
    x, y, width,
    height = 8,
    percentage,
    color = "url(#greenGrad)",
    bgColor = t.bgCardAlt,
    animDelay = "0.3s",
    radius = 4,
  } = opts;

  const clampedPct = Math.min(100, Math.max(0, percentage));
  const fillWidth = (clampedPct / 100) * width;

  return `<g>
    <!-- Background track -->
    <rect x="${x}" y="${y}" width="${width}" height="${height}"
      rx="${radius}" fill="${bgColor}"/>

    <!-- Animated fill -->
    <rect x="${x}" y="${y}" width="${fillWidth.toFixed(1)}" height="${height}"
      rx="${radius}" fill="${color}"
      style="transform-origin: ${x}px ${y}px;
             animation: growBar 1s ${animDelay} ${t.animEasing} both;"/>

    <!-- Percentage label -->
    <text x="${x + width + 8}" y="${y + height - 1}"
      font-family="${t.fontMono}"
      font-size="${t.fontSizeSm}"
      fill="${t.textSecondary}"
      style="animation: fadeIn 0.4s ${animDelay} ease both; opacity: 0;">
      ${clampedPct.toFixed(1)}%
    </text>
  </g>`;
}

// ─── Fire icon (SVG path) ─────────────────────────────────────────────────────

/**
 * Renders an animated fire icon SVG path.
 * The animation uses firePulse keyframe (defined in base.ts shared styles).
 */
export function fireIcon(x: number, y: number, size = 28): string {
  // Scaled fire path (original viewBox 24x24)
  const scale = size / 24;
  const s = (n: number): number => parseFloat((n * scale).toFixed(2));

  return `<g transform="translate(${x}, ${y})"
    style="animation: firePulse ${t.animFireDuration} ease-in-out infinite; transform-origin: ${s(12)}px ${s(20)}px;">
    <!-- Outer flame -->
    <path d="M ${s(12)} 2
      C ${s(12)} 2 ${s(5)} ${s(10)} ${s(5)} ${s(15)}
      C ${s(5)} ${s(19.4)} ${s(8.1)} ${s(23)} ${s(12)} ${s(23)}
      C ${s(15.9)} ${s(23)} ${s(19)} ${s(19.4)} ${s(19)} ${s(15)}
      C ${s(19)} ${s(10)} ${s(12)} 2 Z"
      fill="url(#fireGrad)"/>
    <!-- Inner flame (lighter highlight) -->
    <path d="M ${s(12)} ${s(7)}
      C ${s(12)} ${s(7)} ${s(9)} ${s(12)} ${s(9)} ${s(15)}
      C ${s(9)} ${s(17.2)} ${s(10.3)} ${s(19)} ${s(12)} ${s(19)}
      C ${s(13.7)} ${s(19)} ${s(15)} ${s(17.2)} ${s(15)} ${s(15)}
      C ${s(15)} ${s(12)} ${s(12)} ${s(7)} ${s(12)} ${s(7)} Z"
      fill="${t.accentYellow}" opacity="0.7"/>
  </g>`;
}

// ─── Month labels for trend line ──────────────────────────────────────────────

/**
 * Renders X-axis month labels beneath a trend line.
 */
export function trendMonthLabels(
  x: number,
  y: number,
  width: number,
  months: string[]   // YYYY-MM strings
): string {
  if (months.length === 0) return "";
  const step = width / (months.length - 1);
  return months.map((m, i) => {
    if (i % 2 !== 0 && i !== months.length - 1) return ""; // show every other label
    const lx = x + i * step;
    return `<text x="${lx.toFixed(1)}" y="${y}"
      text-anchor="middle"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeXs}"
      fill="${t.textMuted}">${escapeXml(monthLabel(m))}</text>`;
  }).join("\n");
}

// Re-export WEEKDAY_LABELS for convenience
export { WEEKDAY_LABELS };
