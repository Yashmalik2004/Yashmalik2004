/**
 * lib/analytics/languages.ts
 *
 * Why it exists: Processes raw language byte data into normalized percentages
 * with "Other" bucket handling. Pure functions — no API calls.
 */

import type { LanguageEntry, LanguagesData } from "../github/types";

/**
 * Takes a map of {language → {bytes, color}} and returns
 * top-N languages with percentages that sum to 100.
 *
 * @param rawMap  - Raw aggregated language bytes
 * @param topN    - How many top languages to show (default: 5)
 */
export function computeLanguagePercentages(
  rawMap: Map<string, { bytes: number; color: string }>,
  topN = 5
): LanguagesData {
  if (rawMap.size === 0) {
    return { languages: [], totalBytes: 0 };
  }

  const sorted = Array.from(rawMap.entries())
    .sort(([, a], [, b]) => b.bytes - a.bytes);

  const totalBytes = sorted.reduce((sum, [, { bytes }]) => sum + bytes, 0);

  const top = sorted.slice(0, topN);
  const otherBytes = sorted.slice(topN).reduce((s, [, { bytes }]) => s + bytes, 0);

  const languages: LanguageEntry[] = top.map(([name, { bytes, color }]) => ({
    name,
    color: color ?? "#8B949E",
    bytes,
    percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
  }));

  // Add "Other" bucket if there are remaining languages
  if (otherBytes > 0 && sorted.length > topN) {
    languages.push({
      name: "Other",
      color: "#484F58",
      bytes: otherBytes,
      percentage: totalBytes > 0 ? (otherBytes / totalBytes) * 100 : 0,
    });
  }

  // Normalize so percentages sum exactly to 100 (floating-point correction)
  const sum = languages.reduce((s, l) => s + l.percentage, 0);
  if (sum > 0 && Math.abs(sum - 100) < 0.01) {
    // Apply rounding correction to the largest item
    const diff = 100 - sum;
    const maxIdx = languages.reduce(
      (best, l, i) => (l.percentage > (languages[best]?.percentage ?? 0) ? i : best),
      0
    );
    const maxLang = languages[maxIdx];
    if (maxLang) {
      maxLang.percentage = parseFloat((maxLang.percentage + diff).toFixed(2));
    }
  }

  return { languages, totalBytes };
}

/**
 * Normalizes pre-processed LanguagesData to ensure percentages sum to 100.
 * Used when data comes from the GraphQL client already aggregated.
 */
export function normalizeLanguageData(data: LanguagesData): LanguagesData {
  const total = data.languages.reduce((s, l) => s + l.percentage, 0);
  if (total === 0) return data;

  return {
    ...data,
    languages: data.languages.map((l) => ({
      ...l,
      percentage: parseFloat(((l.percentage / total) * 100).toFixed(2)),
    })),
  };
}
