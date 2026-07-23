/**
 * app/api/cards/activity/route.ts
 *
 * Why it exists: Serves the Activity card (Card 4) as SVG.
 * Fetches 1-year contribution days, computes weekday/hour distributions,
 * caches result, renders bar charts.
 * Cache key: activity:{username} — 15 min TTL.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchContributionDays } from "../../../../lib/github/client";
import { cachedFetch } from "../../../../lib/cache";
import { cacheKey } from "../../../../lib/cache/keys";
import { computeActivity } from "../../../../lib/analytics/activity";
import { renderActivityCard } from "../../../../components/svg/ActivityCard";
import type { ActivityData } from "../../../../lib/github/types";

const DEFAULT_USERNAME = process.env["DEFAULT_USERNAME"] ?? "Yashmalik2004";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") ?? DEFAULT_USERNAME).trim();

  if (!username || username.length > 39) {
    return new NextResponse("Invalid username", { status: 400 });
  }

  try {
    const data = await cachedFetch<ActivityData>(
      cacheKey("activity", username),
      async () => {
        const days = await fetchContributionDays(username);
        return computeActivity(days, 5.5); // IST = UTC+5.5
      }
    );

    const svg = renderActivityCard(data);

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
    console.error("[activity]", message);
    return renderErrorSvg(username, message);
  }
}

function renderErrorSvg(username: string, error: string): NextResponse {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="100" viewBox="0 0 495 100">
    <rect width="495" height="100" rx="10" fill="#161B22"/>
    <text x="20" y="35" font-family="monospace" font-size="14" fill="#F85149">⚠ Failed to load activity for @${username}</text>
    <text x="20" y="60" font-family="monospace" font-size="11" fill="#8B949E">${error.slice(0, 80)}</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
