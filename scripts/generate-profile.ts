/**
 * scripts/generate-profile.ts
 *
 * Entry-point for the Profile Summary SVG generator.
 *
 * Flow:
 *   1. Fetch ProfileData from GitHub GraphQL  (profileStats.ts)
 *   2. Render SVG                             (profileSvg.ts)
 *   3. Write assets/stats/profile-summary.svg
 *
 * Run: npx tsx scripts/generate-profile.ts
 * Env: GITHUB_TOKEN, GITHUB_LOGIN
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname }    from "node:path";
import { fileURLToPath }    from "node:url";

import { fetchProfileData }   from "./profileStats.js";
import { generateProfileSVG } from "./profileSvg.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT    = join(__dirname, "..", "assets", "stats", "profile-summary.svg");
const login     = process.env["GITHUB_LOGIN"] ?? "Yashmalik2004";

async function main(): Promise<void> {
  console.log(`\n🧬 Profile Summary Card Generator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 User   : ${login}`);
  console.log(`📁 Output : ${OUTPUT}\n`);

  console.log("⏳ Fetching profile data...");
  const data = await fetchProfileData(login);

  console.log(`✅ Fetched:`);
  console.log(`   ⭐ Stars      : ${data.totalStars}`);
  console.log(`   🍴 Forks      : ${data.totalForks}`);
  console.log(`   💻 Commits    : ${data.totalCommits}`);
  console.log(`   🔀 PRs        : ${data.totalPRs}`);
  console.log(`   🐛 Issues     : ${data.totalIssues}`);
  console.log(`   📦 Repos      : ${data.totalRepos}`);
  console.log(`   👥 Followers  : ${data.followers}`);
  console.log(`   📅 Since      : ${data.joinedYear}`);
  console.log(`   🌐 Languages  : ${data.topLanguages.map((l) => l.name).join(", ")}\n`);

  console.log("🎨 Generating SVG...");
  const svg = generateProfileSVG(data);

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, svg, "utf-8");

  console.log(`✅ Written : ${OUTPUT}`);
  console.log(`   Size    : ${(Buffer.byteLength(svg, "utf-8") / 1024).toFixed(1)} KB\n`);
  console.log(`✨ Embed with:\n`);
  console.log(`   <img src="./assets/stats/profile-summary.svg" />\n`);
}

main().catch((err: unknown) => {
  console.error(`\n❌ ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
