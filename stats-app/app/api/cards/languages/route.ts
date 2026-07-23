/**
 * app/api/cards/languages/route.ts
 *
 * Why it exists: Serves the Languages card (Card 2) as SVG.
 * Cache key: languages:{username} — 15 min TTL.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchLanguagesData } from "../../../../lib/github/client";
import { cachedFetch } from "../../../../lib/cache";
import { cacheKey } from "../../../../lib/cache/keys";
import { renderLanguagesCard } from "../../../../components/svg/LanguagesCard";
import { normalizeLanguageData } from "../../../../lib/analytics/languages";
import type { LanguagesData } from "../../../../lib/github/types";

const DEFAULT_USERNAME = process.env["DEFAULT_USERNAME"] ?? "Yashmalik2004";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") ?? DEFAULT_USERNAME).trim();

  if (!username || username.length > 39) {
    return new NextResponse("Invalid username", { status: 400 });
  }

  try {
    const data = await cachedFetch<LanguagesData>(
      cacheKey("languages", username),
      async () => {
        const raw = await fetchLanguagesData(username);
        return normalizeLanguageData(raw);
      }
    );

    const svg = renderLanguagesCard(data);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[languages]", message);
    return renderErrorSvg(username, message);
  }
}

function renderErrorSvg(username: string, error: string): NextResponse {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="100" viewBox="0 0 495 100">
    <rect width="495" height="100" rx="10" fill="#161B22"/>
    <text x="20" y="35" font-family="monospace" font-size="14" fill="#F85149">⚠ Failed to load languages for @${username}</text>
    <text x="20" y="60" font-family="monospace" font-size="11" fill="#8B949E">${error.slice(0, 80)}</text>
    <text x="20" y="85" font-family="monospace" font-size="10" fill="#484F58">Check GITHUB_TOKEN scope: read:user, repo</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
