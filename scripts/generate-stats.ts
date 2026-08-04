/**
 * scripts/generate-stats.ts
 *
 * Main entry point for the static SVG generation pipeline.
 *
 * Orchestration flow:
 *   1. Read GITHUB_TOKEN + GITHUB_LOGIN from environment
 *   2. Fetch contribution calendar from GitHub GraphQL API  (githubStats.ts)
 *   3. Convert calendar → normalized day array              (streak.ts)
 *   4. Calculate streaks + build card metrics               (streak.ts)
 *   5. Generate SVG markup                                  (svg.ts)
 *   6. Write SVG to assets/stats/github-stats.svg
 *
 * Run with:
 *   npx tsx scripts/generate-stats.ts
 *
 * Required environment variables:
 *   GITHUB_TOKEN  – Fine-grained or classic PAT with `read:user` scope
 *   GITHUB_LOGIN  – Your GitHub username (default: "Yashmalik2004")
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchContributionData } from "./githubStats.js";
import {
  convertContributionCalendar,
  buildCardMetrics,
} from "./streak.js";
import { generateStatsSVG } from "./svg.js";

// ─── Paths ────────────────────────────────────────────────────────────────────

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Output: <repo-root>/assets/stats/github-stats.svg
const OUTPUT_PATH = join(__dirname, "..", "assets", "stats", "github-stats.svg");

// ─── Config ───────────────────────────────────────────────────────────────────

/** Read the GitHub username from env, with a sensible default */
const login = process.env["GITHUB_LOGIN"] ?? "Yashmalik2004";

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n📊 GitHub Stats Card Generator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 User      : ${login}`);
  console.log(`📁 Output    : ${OUTPUT_PATH}\n`);

  // Step 1: Fetch data from GitHub GraphQL API
  console.log("⏳ Fetching contribution data from GitHub GraphQL API...");
  const data = await fetchContributionData(login, 1);
  console.log(`✅ Fetched   : ${data.days.length} contribution days`);
  console.log(`   Period    : ${data.days[0]?.date} → ${data.days[data.days.length - 1]?.date}`);
  console.log(`   Total     : ${data.totalContributions} contributions\n`);

  // Step 2: Convert raw calendar to normalized ContributionDay[]
  const normalizedDays = convertContributionCalendar(data.calendar);

  // Step 3: Compute streaks + build card metrics
  // We pass the last 90 days to the intensity strip for a dense but readable bar chart
  const metrics = buildCardMetrics(normalizedDays, data.totalContributions, 90);

  console.log("📈 Computed Metrics:");
  console.log(`   🔥 Current Streak  : ${metrics.currentStreak} days`);
  console.log(`   🏆 Longest Streak  : ${metrics.longestStreak} days`);
  console.log(`   📊 Total Contributions : ${metrics.totalContributions}`);
  console.log(`   📅 Strip days      : ${metrics.recentDays.length}\n`);

  // Step 4: Render SVG
  console.log("🎨 Generating SVG...");
  const svg = generateStatsSVG(metrics);

  // Step 5: Ensure output directory exists and write file
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, svg, "utf-8");

  console.log(`✅ SVG written to: ${OUTPUT_PATH}`);
  console.log(`   Size         : ${(Buffer.byteLength(svg, "utf-8") / 1024).toFixed(1)} KB`);
  console.log(`\n✨ Done! Embed with:\n`);
  console.log(`   <img src="./assets/stats/github-stats.svg" />\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n❌ Fatal error: ${message}\n`);
  process.exit(1);
});
