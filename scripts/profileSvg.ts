/**
 * scripts/profileSvg.ts
 *
 * Responsibility: Render the Profile Summary SVG card.
 *   - Receives ProfileData, returns SVG string
 *   - No API calls, no analytics calculations
 *
 * Design: Tokyo Night sci-fi theme matching the stats card.
 *   Card is wider (900px) and taller (320px) — two visual zones:
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  ◉ ◉ ◉  Profile Summary                        @login    │  ← header
 *   ├──────────┬──────────┬──────────┬──────────┬──────────────┤
 *   │  ⭐ Stars │ 🍴 Forks │ 💻 Commits│ 🔀 PRs   │ 🐛 Issues   │  ← stat row
 *   ├──────────┴──────────┴──────────┴──────────┴──────────────┤
 *   │  📦 Repos   👥 Followers   ➡️ Following   📅 Since        │  ← meta row
 *   ├──────────────────────────────────────────────────────────┤
 *   │  TOP LANGUAGES ───────────────────────────────────────── │  ← lang section
 *   │  ████████████░░░░░░░░░░  TypeScript 62.4%               │
 *   │  ████░░░░░░░░░░░░░░░░░░  Python     18.1%               │
 *   │  ...                                                      │
 *   ├──────────────────────────────────────────────────────────┤
 *   │  Updated automatically via GitHub Actions                 │  ← footer
 *   └──────────────────────────────────────────────────────────┘
 */

import type { ProfileData, LanguageEntry } from "./profileStats.js";

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg:           "#1a1b27",
  bgCard:       "#1e2035",
  bgPillar:     "#222436",
  borderColor:  "#292e42",
  textPrimary:  "#c0caf5",
  textSecondary:"#565f89",
  textMuted:    "#3b4261",
  accentPurple: "#bb9af7",
  accentCyan:   "#7dcfff",
  accentGreen:  "#9ece6a",
  accentOrange: "#ff9e64",
  accentGold:   "#e0af68",
  accentRed:    "#f7768e",
  accentBlue:   "#2ac3de",
  fontDisplay:  "'Inter','Segoe UI',system-ui,sans-serif",
  fontMono:     "'JetBrains Mono','Fira Code','Courier New',monospace",
} as const;

// ─── Dimensions ───────────────────────────────────────────────────────────────

const W   = 900;
const H   = 340;
const R   = 18;
const PAD = 26;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format numbers: 1234 → "1.2k", 12000 → "12k", 999 → "999" */
function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

// ─── SVG sub-sections ─────────────────────────────────────────────────────────

function renderDefs(): string {
  return /* svg */ `
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap');

      @keyframes fadeSlide {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      @keyframes scanline {
        0%   { transform: translateY(-100%); }
        100% { transform: translateY(400%);  }
      }
      @keyframes barFill {
        from { width: 0; }
      }

      .f0 { animation: fadeSlide .4s ease both; }
      .f1 { animation: fadeSlide .4s .08s ease both; }
      .f2 { animation: fadeSlide .4s .16s ease both; }
      .f3 { animation: fadeSlide .4s .24s ease both; }
      .f4 { animation: fadeSlide .4s .32s ease both; }
      .f5 { animation: fadeSlide .4s .40s ease both; }
      .f6 { animation: fadeSlide .4s .48s ease both; }

      .lang-bar { animation: barFill .7s .5s cubic-bezier(.25,.46,.45,.94) both; }
    </style>

    <!-- Header gradient: purple → cyan → green -->
    <linearGradient id="hdr-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${T.accentPurple}"/>
      <stop offset="50%"  stop-color="${T.accentCyan}"/>
      <stop offset="100%" stop-color="${T.accentGreen}"/>
    </linearGradient>

    <!-- Pillar gradient top→bottom -->
    <linearGradient id="pill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#252740"/>
      <stop offset="100%" stop-color="#1c1d30"/>
    </linearGradient>

    <!-- Glow filter for big numbers -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- Card shadow -->
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000" flood-opacity=".5"/>
    </filter>

    <!-- Scanline overlay clip -->
    <clipPath id="card-clip">
      <rect width="${W}" height="${H}" rx="${R}"/>
    </clipPath>
  </defs>`;
}

function renderBackground(): string {
  return /* svg */ `
  <!-- Background -->
  <rect width="${W}" height="${H}" rx="${R}" fill="${T.bg}" filter="url(#shadow)"/>

  <!-- Subtle scanline animation (sci-fi CRT feel) -->
  <g clip-path="url(#card-clip)" opacity="0.03">
    <rect width="${W}" height="2" fill="${T.accentCyan}" y="0">
      <animateTransform attributeName="transform" type="translate"
        values="0,0;0,${H * 4}" dur="4s" repeatCount="indefinite"/>
    </rect>
  </g>

  <!-- Top accent gradient bar -->
  <rect x="${R}" y="0" width="${W - R * 2}" height="2.5" rx="1" fill="url(#hdr-grad)" opacity=".95" class="f0"/>

  <!-- Inner border -->
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}"
    rx="${R - .5}" fill="none" stroke="${T.borderColor}" stroke-width="1.5"/>

  <!-- Vertical divider between lang section and right side (decorative) -->
  <line x1="${PAD}" y1="${H - 44}" x2="${W - PAD}" y2="${H - 44}"
    stroke="${T.borderColor}" stroke-width=".75" opacity=".6"/>`;
}

function renderHeader(login: string): string {
  const y = PAD + 16;
  return /* svg */ `
  <!-- Header -->
  <g class="f0">
    <circle cx="${PAD + 5}"  cy="${y - 4}" r="4" fill="${T.accentOrange}" opacity=".9"/>
    <circle cx="${PAD + 17}" cy="${y - 4}" r="4" fill="${T.accentGreen}"  opacity=".9"/>
    <circle cx="${PAD + 29}" cy="${y - 4}" r="4" fill="${T.accentCyan}"   opacity=".9"/>
    <text x="${PAD + 45}" y="${y}"
      font-family="${T.fontDisplay}" font-size="14" font-weight="700"
      fill="url(#hdr-grad)" letter-spacing=".5">Profile Summary</text>
  </g>
  <!-- Login badge (top-right) -->
  <g class="f0">
    <rect x="${W - PAD - 120}" y="${PAD}" width="120" height="22" rx="6"
      fill="${T.bgPillar}" stroke="${T.borderColor}" stroke-width="1"/>
    <text x="${W - PAD - 60}" y="${PAD + 15}"
      text-anchor="middle" font-family="${T.fontMono}" font-size="11"
      fill="${T.accentCyan}">@${esc(login)}</text>
  </g>`;
}

/** Renders a single stat pillar: icon + big number + label */
function pillar(
  cx: number,
  cy: number,
  pw: number,
  ph: number,
  icon: string,
  value: string,
  label: string,
  color: string,
  fadeClass: string
): string {
  const x = cx - pw / 2;
  const y = cy - ph / 2;
  return /* svg */ `
  <g class="${fadeClass}">
    <rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="9"
      fill="url(#pill-grad)" stroke="${T.borderColor}" stroke-width="1"/>
    <text x="${cx}" y="${y + 18}" text-anchor="middle" font-size="14">${esc(icon)}</text>
    <text x="${cx}" y="${y + 42}" text-anchor="middle"
      font-family="${T.fontMono}" font-size="22" font-weight="700"
      fill="${color}" filter="url(#glow)">${esc(value)}</text>
    <text x="${cx}" y="${y + 58}" text-anchor="middle"
      font-family="${T.fontDisplay}" font-size="8" font-weight="600"
      fill="${T.textSecondary}" letter-spacing=".8">${esc(label.toUpperCase())}</text>
  </g>`;
}

function renderStatRow(data: ProfileData): string {
  const rowY  = 56;
  const ph    = 68;
  const pw    = Math.floor((W - PAD * 2 - 16) / 5);
  const gap   = (W - PAD * 2 - pw * 5) / 4;

  const stats = [
    { icon: "⭐", value: fmt(data.totalStars),   label: "Total Stars",   color: T.accentGold,   f: "f1" },
    { icon: "🍴", value: fmt(data.totalForks),   label: "Total Forks",   color: T.accentBlue,   f: "f2" },
    { icon: "💻", value: fmt(data.totalCommits), label: "Commits (2yr)", color: T.accentGreen,  f: "f3" },
    { icon: "🔀", value: fmt(data.totalPRs),     label: "Pull Requests", color: T.accentPurple, f: "f4" },
    { icon: "🐛", value: fmt(data.totalIssues),  label: "Issues Opened", color: T.accentRed,    f: "f5" },
  ] as const;

  return stats.map((s, i) => {
    const cx = PAD + pw / 2 + i * (pw + gap);
    return pillar(cx, rowY + ph / 2, pw, ph, s.icon, s.value, s.label, s.color, s.f);
  }).join("");
}

function renderMetaRow(data: ProfileData): string {
  const y = 148;
  const items = [
    { label: "Public Repos",  value: String(data.totalRepos),      icon: "📦" },
    { label: "Followers",     value: fmt(data.followers),           icon: "👥" },
    { label: "Following",     value: String(data.following),        icon: "➡️" },
    { label: "Member Since",  value: data.joinedYear,               icon: "📅" },
    { label: "This Year",     value: fmt(data.contributionsThisYear), icon: "📈" },
  ];

  const colW = (W - PAD * 2) / items.length;
  return items.map((item, i) => {
    const cx = PAD + colW * i + colW / 2;
    return /* svg */ `
    <g class="f3">
      <text x="${cx}" y="${y}"
        text-anchor="middle" font-family="${T.fontMono}" font-size="13"
        font-weight="700" fill="${T.textPrimary}">${esc(item.icon)} ${esc(item.value)}</text>
      <text x="${cx}" y="${y + 14}"
        text-anchor="middle" font-family="${T.fontDisplay}" font-size="8"
        fill="${T.textSecondary}" letter-spacing=".6">${esc(item.label.toUpperCase())}</text>
    </g>`;
  }).join("");
}

function renderLanguages(langs: LanguageEntry[]): string {
  if (langs.length === 0) return "";

  const sectionY = 184;
  const labelY   = sectionY + 10;
  const barY     = sectionY + 20;
  const barH     = 7;
  const barGap   = 1.5;

  // --- Full-width segmented color bar ---
  const barW = W - PAD * 2;
  let barX = PAD;
  const colorBar = langs.map((lang) => {
    const segW = (lang.percentage / 100) * barW;
    const seg = /* svg */ `<rect x="${barX.toFixed(1)}" y="${barY}" width="${segW.toFixed(1)}" height="${barH}" rx="2" fill="${lang.color}" class="lang-bar"/>`;
    barX += segW + barGap;
    return seg;
  }).join("");

  // --- Language legend rows (2 columns) ---
  const leftColX  = PAD;
  const rightColX = PAD + (W - PAD * 2) / 2 + 12;
  const legendY   = barY + barH + 16;

  const legend = langs.map((lang, i) => {
    const x   = i % 2 === 0 ? leftColX : rightColX;
    const y   = legendY + Math.floor(i / 2) * 22;
    const pct = lang.percentage.toFixed(1);

    return /* svg */ `
    <g class="f5">
      <!-- Color dot -->
      <circle cx="${x + 6}" cy="${y - 4}" r="5" fill="${lang.color}"/>
      <!-- Lang name -->
      <text x="${x + 16}" y="${y}"
        font-family="${T.fontMono}" font-size="11" font-weight="700"
        fill="${T.textPrimary}">${esc(lang.name)}</text>
      <!-- Percentage -->
      <text x="${x + 16 + 110}" y="${y}"
        font-family="${T.fontMono}" font-size="10"
        fill="${T.textSecondary}">${pct}%</text>
      <!-- Mini bar track -->
      <rect x="${x + 16 + 140}" y="${y - 8}" width="80" height="6" rx="3" fill="${T.bgPillar}"/>
      <!-- Mini bar fill -->
      <rect x="${x + 16 + 140}" y="${y - 8}" width="${(lang.percentage / 100) * 80}" height="6" rx="3" fill="${lang.color}" opacity=".85" class="lang-bar"/>
    </g>`;
  }).join("");

  return /* svg */ `
  <!-- Languages section -->
  <g class="f4">
    <!-- Section label -->
    <text x="${PAD}" y="${labelY}"
      font-family="${T.fontDisplay}" font-size="8" font-weight="700"
      fill="${T.textSecondary}" letter-spacing="1">TOP LANGUAGES</text>

    <!-- Divider -->
    <line x1="${PAD + 96}" y1="${labelY - 4}" x2="${W - PAD}" y2="${labelY - 4}"
      stroke="${T.borderColor}" stroke-width=".75" opacity=".7"/>
  </g>

  <!-- Segmented color bar -->
  ${colorBar}

  <!-- Legend -->
  ${legend}`;
}

function renderFooter(): string {
  const fy = H - 12;
  return /* svg */ `
  <g class="f6">
    <text x="${W / 2}" y="${fy}"
      text-anchor="middle" font-family="${T.fontDisplay}" font-size="8"
      fill="${T.textMuted}" letter-spacing=".3">
      Updated automatically via GitHub Actions · Data from GitHub GraphQL API
    </text>
  </g>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateProfileSVG(data: ProfileData): string {
  return /* svg */ `<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="GitHub Profile Summary Card">

  <title>GitHub Profile Summary — @${esc(data.login)}</title>
  <desc>
    ${esc(data.totalStars.toString())} stars, ${esc(data.totalCommits.toString())} commits,
    ${esc(data.totalPRs.toString())} PRs, ${esc(data.totalIssues.toString())} issues,
    ${esc(data.totalRepos.toString())} repositories.
  </desc>

  ${renderDefs()}
  ${renderBackground()}
  ${renderHeader(data.login)}
  ${renderStatRow(data)}
  ${renderMetaRow(data)}
  ${renderLanguages(data.topLanguages)}
  ${renderFooter()}

</svg>`;
}
