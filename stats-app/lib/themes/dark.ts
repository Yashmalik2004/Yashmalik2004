/**
 * lib/themes/dark.ts
 *
 * Why it exists: Single source of truth for all visual design tokens.
 * Every color, font, gradient, and radius value lives here.
 * SVG renderers import from this file — never hardcode values.
 */

export const darkTheme = {
  // ─── Background ───────────────────────────────────────────────────────────
  bgPrimary: "#0D1117",        // GitHub dark background
  bgCard: "#161B22",           // Card surface
  bgCardAlt: "#1C2128",        // Alternate card surface (stripes, etc.)
  bgGlass: "rgba(22,27,34,0.85)",

  // ─── Borders ──────────────────────────────────────────────────────────────
  borderColor: "#30363D",
  borderRadius: 16,
  borderRadiusSm: 8,
  borderRadiusXs: 4,

  // ─── Text ─────────────────────────────────────────────────────────────────
  textPrimary: "#E6EDF3",      // High-contrast white
  textSecondary: "#8B949E",    // Muted grey
  textMuted: "#484F58",        // Very muted
  textAccent: "#58A6FF",       // Blue accent (GitHub link color)

  // ─── Accent palette ───────────────────────────────────────────────────────
  accentBlue: "#58A6FF",
  accentGreen: "#3FB950",
  accentPurple: "#BC8CFF",
  accentOrange: "#FFA657",
  accentRed: "#F85149",
  accentYellow: "#E3B341",
  accentTeal: "#39D353",

  // ─── Gradients ────────────────────────────────────────────────────────────
  gradientHeader:
    "linear-gradient(135deg, #1C2128 0%, #161B22 50%, #0D1117 100%)",
  gradientAccent:
    "linear-gradient(90deg, #58A6FF 0%, #BC8CFF 50%, #3FB950 100%)",
  gradientFire:
    "linear-gradient(180deg, #FFA657 0%, #F85149 100%)",
  gradientGreen:
    "linear-gradient(135deg, #0E4429 0%, #006D32 50%, #26A641 100%)",

  // ─── Contribution heat palette (matches existing heatmap) ─────────────────
  heatPalette: ["#161B22", "#0E4429", "#006D32", "#26A641", "#39D353"],

  // ─── Typography ───────────────────────────────────────────────────────────
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  fontMono: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
  fontSizeXs: 10,
  fontSizeSm: 12,
  fontSizeMd: 14,
  fontSizeLg: 16,
  fontSizeXl: 20,
  fontSizeXxl: 28,

  // ─── Card dimensions ──────────────────────────────────────────────────────
  cardWidth: 495,
  cardPadding: 24,

  // ─── Animation timing ─────────────────────────────────────────────────────
  animDuration: "0.8s",
  animEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
  animCounterDuration: "1.5s",
  animBarDuration: "1s",
  animFireDuration: "1.2s",
} as const;

export type DarkTheme = typeof darkTheme;
