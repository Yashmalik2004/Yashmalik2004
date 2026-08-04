/**
 * scripts/svg.ts
 *
 * Responsibility: Pure SVG rendering layer.
 *   - Receives computed metrics and returns SVG markup as a string
 *   - No GitHub API calls
 *   - No streak or analytics calculations
 *   - Designed so any future card can import helpers from here
 *
 * Design: Tokyo Night dark theme — a premium card with:
 *   - Animated gradient title glow
 *   - Three metric pillars (🔥 Streak / 🏆 Longest / 📈 Total)
 *   - A modern horizontal intensity strip (rounded bars, not squares)
 *   - Subtle shimmer / fade-in animations via CSS
 */

import type { CardMetrics, ContributionDay } from "./streak.js";

// ─── Theme ────────────────────────────────────────────────────────────────────

const THEME = {
  // Backgrounds
  bg:           "#1a1b27",
  bgCard:       "#16213e",
  bgPillar:     "#1e2035",

  // Tokyo Night accent palette
  accentOrange: "#ff9e64", // 🔥 current streak
  accentGold:   "#e0af68", // 🏆 longest streak
  accentCyan:   "#7dcfff", // 📈 total contributions
  accentPurple: "#bb9af7", // decorative / borders
  accentBlue:   "#2ac3de",

  // Text
  textPrimary:   "#c0caf5",
  textSecondary: "#565f89",
  textMuted:     "#3b4261",

  // Borders
  borderColor: "#292e42",

  // Intensity strip colours (0 = NONE → 4 = FOURTH_QUARTILE)
  stripColors: [
    "#1e2035", // 0 – NONE
    "#164e3b", // 1 – FIRST_QUARTILE  (dark green)
    "#1e7a5e", // 2 – SECOND_QUARTILE
    "#26a96e", // 3 – THIRD_QUARTILE
    "#9ece6a", // 4 – FOURTH_QUARTILE (bright Tokyo green)
  ],

  // Typography — loaded via Google Fonts (injected in <defs>)
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  fontDisplay: "'Inter', 'Segoe UI', system-ui, sans-serif",
} as const;

// ─── Card Dimensions ──────────────────────────────────────────────────────────

const W = 700;  // card width
const H = 270;  // card height (taller for more breathing room)
const R = 18;   // corner radius
const PAD = 24; // internal padding

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape XML special characters to prevent SVG injection */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format a number with thousands separators, e.g. 1234 → "1,234" */
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

/**
 * Renders the <defs> block containing:
 *   - Google Fonts import via @font-face (SVG-compatible)
 *   - CSS animations (fade-in, shimmer)
 *   - Gradient definitions
 */
function renderDefs(): string {
  return /* svg */ `
  <defs>
    <!-- Google Fonts: Inter + JetBrains Mono -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap');

      .card-root { overflow: hidden; }

      /* Fade-in animations with staggered delays */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      @keyframes shimmer {
        0%   { stop-color: #bb9af7; }
        50%  { stop-color: #7dcfff; }
        100% { stop-color: #bb9af7; }
      }
      @keyframes barGrow {
        from { transform: scaleX(0); transform-origin: left; }
        to   { transform: scaleX(1); transform-origin: left; }
      }

      .fi-0 { animation: fadeIn 0.45s ease both; }
      .fi-1 { animation: fadeIn 0.45s 0.10s ease both; }
      .fi-2 { animation: fadeIn 0.45s 0.20s ease both; }
      .fi-3 { animation: fadeIn 0.45s 0.30s ease both; }
      .fi-4 { animation: fadeIn 0.45s 0.40s ease both; }
      .fi-5 { animation: fadeIn 0.45s 0.50s ease both; }

      .strip-bar { animation: barGrow 0.6s 0.55s cubic-bezier(.25,.46,.45,.94) both; }
    </style>

    <!-- Title gradient (animated hue shift) -->
    <linearGradient id="title-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#bb9af7"/>
      <stop offset="50%"  stop-color="#7dcfff"/>
      <stop offset="100%" stop-color="#9ece6a"/>
    </linearGradient>

    <!-- Pillar background gradient (subtle top→bottom depth) -->
    <linearGradient id="pillar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#222436" stop-opacity="1"/>
      <stop offset="100%" stop-color="#1a1b2e" stop-opacity="1"/>
    </linearGradient>

    <!-- Glow filter for large metric numbers -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Card drop shadow -->
    <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>`;
}

/**
 * Renders the card background: outer rounded rect + decorative top border glow.
 */
function renderBackground(): string {
  return /* svg */ `
  <!-- Card shell -->
  <rect width="${W}" height="${H}" rx="${R}" ry="${R}"
    fill="${THEME.bg}" filter="url(#card-shadow)" class="card-root fi-0"/>

  <!-- Top gradient accent line -->
  <rect x="${R}" y="0" width="${W - R * 2}" height="2" rx="1"
    fill="url(#title-grad)" opacity="0.9" class="fi-0"/>

  <!-- Subtle inner border -->
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}"
    rx="${R - 0.5}" ry="${R - 0.5}"
    fill="none" stroke="${THEME.borderColor}" stroke-width="1.5"/>`;
}

/**
 * Renders the header section: logo icon + card title.
 */
function renderHeader(): string {
  const titleY = PAD + 16;
  return /* svg */ `
  <!-- Header -->
  <g class="fi-1">
    <!-- Logo dots (decorative) -->
    <circle cx="${PAD + 5}" cy="${titleY - 4}" r="4" fill="#ff9e64" opacity="0.9"/>
    <circle cx="${PAD + 17}" cy="${titleY - 4}" r="4" fill="#9ece6a" opacity="0.9"/>
    <circle cx="${PAD + 29}" cy="${titleY - 4}" r="4" fill="#7dcfff" opacity="0.9"/>

    <!-- Title -->
    <text x="${PAD + 45}" y="${titleY}"
      font-family="${THEME.fontDisplay}"
      font-size="14"
      font-weight="700"
      fill="url(#title-grad)"
      letter-spacing="0.5">GitHub Contribution Stats</text>
  </g>`;
}

/**
 * Renders a single metric pillar with icon, large number, and label.
 *
 * @param x        - left edge of the pillar
 * @param value    - the number to display (formatted)
 * @param label    - descriptive label below the number
 * @param icon     - emoji icon
 * @param color    - accent color for the number
 * @param fadeClass - CSS animation class for stagger
 * @param pillW    - pillar width
 */
function renderPillar(
  x: number,
  value: string,
  label: string,
  icon: string,
  color: string,
  fadeClass: string,
  pillW: number
): string {
  const pillH = 72;
  const pillY = PAD + 30;
  const cx = x + pillW / 2;

  return /* svg */ `
  <g class="${fadeClass}">
    <!-- Pillar background -->
    <rect x="${x}" y="${pillY}" width="${pillW}" height="${pillH}" rx="10"
      fill="url(#pillar-grad)" stroke="${THEME.borderColor}" stroke-width="1"/>

    <!-- Icon -->
    <text x="${cx}" y="${pillY + 20}"
      text-anchor="middle"
      font-size="16">${esc(icon)}</text>

    <!-- Large metric number -->
    <text x="${cx}" y="${pillY + 48}"
      text-anchor="middle"
      font-family="${THEME.fontFamily}"
      font-size="24"
      font-weight="700"
      fill="${color}"
      filter="url(#glow)">${esc(value)}</text>

    <!-- Label -->
    <text x="${cx}" y="${pillY + 64}"
      text-anchor="middle"
      font-family="${THEME.fontDisplay}"
      font-size="9"
      font-weight="600"
      fill="${THEME.textSecondary}"
      letter-spacing="0.8">${esc(label.toUpperCase())}</text>
  </g>`;
}

/**
 * Renders the three metric pillars in a horizontal row.
 */
function renderMetrics(
  currentStreak: number,
  longestStreak: number,
  totalContributions: number
): string {
  const pillGap = 8;
  const pillW = Math.floor((W - PAD * 2 - pillGap * 2) / 3);

  const metrics = [
    { value: fmt(currentStreak),        label: "Current Streak",  icon: "🔥", color: THEME.accentOrange, fade: "fi-2" },
    { value: fmt(longestStreak),        label: "Longest Streak",  icon: "🏆", color: THEME.accentGold,   fade: "fi-3" },
    { value: fmt(totalContributions),   label: "Total Contributions", icon: "📈", color: THEME.accentCyan, fade: "fi-4" },
  ] as const;

  return metrics
    .map((m, i) => {
      const x = PAD + i * (pillW + pillGap);
      return renderPillar(x, m.value, m.label, m.icon, m.color, m.fade, pillW);
    })
    .join("\n");
}

/**
 * Renders the horizontal contribution intensity strip.
 *
 * Instead of the traditional square grid, this renders a series of
 * vertically-stacked rounded rectangles whose height and opacity represent
 * contribution intensity. Think: ██████▇▇▆▅▅▃▂▁ rotated 90°.
 *
 * Each day = one vertical bar. Height ∝ level (0–4). Width is dynamic to
 * fill the available space with a small gap between bars.
 */
function renderIntensityStrip(recentDays: ContributionDay[]): string {
  if (recentDays.length === 0) return "";

  const stripY = 165;          // top of the strip area (pushed down for more breathing room)
  const stripH = 42;           // max bar height (taller bars fill the extra space)
  const stripBottom = stripY + stripH;
  const stripW = W - PAD * 2;  // available width

  const n = recentDays.length;
  const gap = 1.5;
  const barW = Math.max(2, (stripW - gap * (n - 1)) / n);

  const bars = recentDays
    .map((day, i) => {
      const level = day.level;  // 0–4
      const color = THEME.stripColors[level] ?? THEME.stripColors[0];

      // Height is proportional to intensity level
      // Level 0 → minimal stub (2px), Level 4 → full height (stripH)
      const barH = level === 0 ? 2 : Math.round((level / 4) * stripH);
      const opacity = level === 0 ? 0.3 : 0.6 + (level / 4) * 0.4;
      const bx = PAD + i * (barW + gap);
      const by = stripBottom - barH;

      return /* svg */ `<rect x="${bx.toFixed(1)}" y="${by}" width="${barW.toFixed(1)}" height="${barH}" rx="1.5" ry="1.5" fill="${color}" opacity="${opacity.toFixed(2)}" class="strip-bar"/>`;
    })
    .join("\n    ");

  return /* svg */ `
  <!-- Contribution Intensity Strip -->
  <g class="fi-4">
    <!-- Strip label -->
    <text x="${PAD}" y="${stripY - 6}"
      font-family="${THEME.fontDisplay}"
      font-size="8"
      font-weight="600"
      fill="${THEME.textSecondary}"
      letter-spacing="0.6">CONTRIBUTION ACTIVITY · LAST ${n} DAYS</text>

    <!-- Intensity bars -->
    ${bars}
  </g>`;
}

/**
 * Renders the footer: update timestamp notice.
 */
function renderFooter(): string {
  const footerY = H - 10;
  return /* svg */ `
  <!-- Footer -->
  <g class="fi-5">
    <!-- Decorative separator -->
    <line x1="${PAD}" y1="${footerY - 8}" x2="${W - PAD}" y2="${footerY - 8}"
      stroke="${THEME.borderColor}" stroke-width="0.75" opacity="0.5"/>

    <!-- Footer text -->
    <text x="${W / 2}" y="${footerY}"
      text-anchor="middle"
      font-family="${THEME.fontDisplay}"
      font-size="8"
      fill="${THEME.textMuted}"
      letter-spacing="0.3">Updated automatically via GitHub Actions · Data from GitHub GraphQL API</text>
  </g>`;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

/**
 * Generates the full SVG card markup from the computed card metrics.
 *
 * This is the only public function of this module.
 * Input:  CardMetrics  (from streak.ts buildCardMetrics)
 * Output: SVG string   (ready to write to disk)
 */
export function generateStatsSVG(metrics: CardMetrics): string {
  const {
    currentStreak,
    longestStreak,
    totalContributions,
    recentDays,
  } = metrics;

  return /* svg */ `<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}"
  height="${H}"
  viewBox="0 0 ${W} ${H}"
  role="img"
  aria-label="GitHub Contribution Stats Card">

  <title>GitHub Contribution Stats — ${esc(String(currentStreak))} day streak</title>
  <desc>
    Current streak: ${esc(fmt(currentStreak))} days.
    Longest streak: ${esc(fmt(longestStreak))} days.
    Total contributions: ${esc(fmt(totalContributions))}.
  </desc>

  ${renderDefs()}

  <!-- === Card === -->
  ${renderBackground()}
  ${renderHeader()}
  ${renderMetrics(currentStreak, longestStreak, totalContributions)}
  ${renderIntensityStrip(recentDays)}
  ${renderFooter()}

</svg>`;
}
