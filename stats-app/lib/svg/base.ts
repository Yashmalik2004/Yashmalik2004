/**
 * lib/svg/base.ts
 *
 * Why it exists: Reusable SVG building blocks used by every card.
 * - Card shell (background, border, glassmorphism effect)
 * - Section divider lines
 * - Shared CSS animation keyframes (injected once per card)
 * - Text helpers (truncation, alignment)
 *
 * All functions return raw SVG strings — no framework required.
 */

import { darkTheme as t } from "../themes/dark";

// ─── Card shell ───────────────────────────────────────────────────────────────

interface CardShellOptions {
  width?: number;
  height: number;
  title?: string;
  titleIcon?: string;
}

/**
 * Renders the outer SVG wrapper with glassmorphism background, border,
 * animated gradient shimmer, and optional title row.
 */
export function cardShell(opts: CardShellOptions, inner: string): string {
  const w = opts.width ?? t.cardWidth;
  const { height } = opts;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${w}" height="${height}" viewBox="0 0 ${w} ${height}"
    role="img" aria-label="${opts.title ?? "GitHub Stats Card"}">
  <title>${opts.title ?? "GitHub Stats Card"}</title>
  <defs>
    ${sharedDefs(w, height)}
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${height}" rx="${t.borderRadius}" fill="${t.bgCard}" />

  <!-- Glassmorphism shimmer overlay -->
  <rect width="${w}" height="${height}" rx="${t.borderRadius}"
    fill="url(#shimmer-${w})" opacity="0.35" />

  <!-- Border -->
  <rect width="${w}" height="${height}" rx="${t.borderRadius}"
    fill="none" stroke="${t.borderColor}" stroke-width="1" />

  <!-- Gradient accent top bar -->
  <rect width="${w}" height="3" rx="${t.borderRadius}"
    fill="url(#accentGrad)" />

  ${opts.title ? titleRow(opts.title, opts.titleIcon) : ""}

  ${inner}
</svg>`;
}

/** Shared SVG defs (gradients, filters) injected into every card */
function sharedDefs(w: number, h: number): string {
  return `
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accentBlue}">
        <animate attributeName="stop-color"
          values="${t.accentBlue};${t.accentPurple};${t.accentGreen};${t.accentBlue}"
          dur="6s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="${t.accentPurple}">
        <animate attributeName="stop-color"
          values="${t.accentPurple};${t.accentGreen};${t.accentBlue};${t.accentPurple}"
          dur="6s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>

    <linearGradient id="shimmer-${w}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.01"/>
    </linearGradient>

    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accentGreen}"/>
      <stop offset="100%" stop-color="${t.accentTeal}"/>
    </linearGradient>

    <linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${t.accentYellow}"/>
      <stop offset="100%" stop-color="${t.accentOrange}"/>
    </linearGradient>

    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accentBlue}"/>
      <stop offset="100%" stop-color="${t.accentPurple}"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <clipPath id="card-clip">
      <rect width="${w}" height="${h}" rx="${t.borderRadius}"/>
    </clipPath>

    ${sharedStyles()}
  `;
}

/** Shared CSS animations injected via <style> in defs */
function sharedStyles(): string {
  return `<style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes countUp {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes drawLine {
      from { stroke-dashoffset: 1000; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes growBar {
      from { transform: scaleY(0); }
      to   { transform: scaleY(1); }
    }
    @keyframes spin {
      from { transform: rotate(-90deg); }
      to   { transform: rotate(270deg); }
    }
    @keyframes firePulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.15); opacity: 0.85; }
    }
    @keyframes shimmer {
      from { opacity: 0.3; }
      to   { opacity: 0.7; }
    }
    .fade-in { animation: fadeIn 0.6s ease forwards; }
    .fade-in-d1 { animation: fadeIn 0.6s 0.1s ease both; }
    .fade-in-d2 { animation: fadeIn 0.6s 0.2s ease both; }
    .fade-in-d3 { animation: fadeIn 0.6s 0.3s ease both; }
    .fade-in-d4 { animation: fadeIn 0.6s 0.4s ease both; }
    .fade-in-d5 { animation: fadeIn 0.6s 0.5s ease both; }
    .stagger-item { opacity: 0; }
  </style>`;
}

/** Renders the card title row with optional emoji icon */
function titleRow(title: string, icon?: string): string {
  return `<g class="fade-in">
    <text x="${t.cardPadding}" y="42"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeLg}"
      font-weight="700"
      fill="${t.textPrimary}">
      ${icon ? `<tspan>${icon} </tspan>` : ""}<tspan>${escapeXml(title)}</tspan>
    </text>
    <line x1="${t.cardPadding}" y1="52" x2="${t.cardWidth - t.cardPadding}" y2="52"
      stroke="${t.borderColor}" stroke-width="1" opacity="0.5"/>
  </g>`;
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

/** Escapes XML special characters in a string to prevent SVG injection */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Truncates a string to maxLen chars, adding ellipsis if needed */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/** Formats a large number with compact notation (e.g. 1234 → "1.2k") */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

/** Zero-pads a number to 2 digits */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Converts a month string (YYYY-MM) to abbreviated label (e.g. "Jan") */
export function monthLabel(ym: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = parseInt(ym.slice(5, 7), 10) - 1;
  return months[m] ?? ym.slice(5, 7);
}

/** Day-of-week abbreviations */
export const WEEKDAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Stat item helper ─────────────────────────────────────────────────────────

interface StatItemOpts {
  x: number;
  y: number;
  label: string;
  value: string;
  icon: string;
  color?: string;
  animDelay?: string;
}

/** Renders a single labelled stat item (icon + value + label) */
export function statItem(opts: StatItemOpts): string {
  const color = opts.color ?? t.textPrimary;
  const delay = opts.animDelay ?? "0s";
  return `<g style="animation: fadeIn 0.6s ${delay} ease both; opacity: 0;">
    <text x="${opts.x}" y="${opts.y}"
      font-family="${t.fontMono}"
      font-size="${t.fontSizeLg}"
      fill="${color}">${escapeXml(opts.icon)}</text>
    <text x="${opts.x + 28}" y="${opts.y}"
      font-family="${t.fontMono}"
      font-size="${t.fontSizeMd}"
      font-weight="700"
      fill="${t.textPrimary}">${escapeXml(opts.value)}</text>
    <text x="${opts.x + 28}" y="${opts.y + 16}"
      font-family="${t.fontFamily}"
      font-size="${t.fontSizeSm}"
      fill="${t.textSecondary}">${escapeXml(opts.label)}</text>
  </g>`;
}
