/**
 * tests/languages.test.ts
 *
 * Unit tests for language analytics (lib/analytics/languages.ts).
 */

import { describe, it, expect } from "vitest";
import { computeLanguagePercentages, normalizeLanguageData } from "../lib/analytics/languages";

function buildMap(
  entries: Array<[string, number, string]>
): Map<string, { bytes: number; color: string }> {
  const m = new Map<string, { bytes: number; color: string }>();
  for (const [name, bytes, color] of entries) {
    m.set(name, { bytes, color });
  }
  return m;
}

describe("computeLanguagePercentages", () => {
  it("returns empty result for empty map", () => {
    const result = computeLanguagePercentages(new Map());
    expect(result.languages).toHaveLength(0);
    expect(result.totalBytes).toBe(0);
  });

  it("returns top 5 languages sorted by bytes descending", () => {
    const m = buildMap([
      ["JavaScript", 5000, "#f1e05a"],
      ["TypeScript", 8000, "#3178c6"],
      ["Python",     3000, "#3572A5"],
      ["Rust",       2000, "#dea584"],
      ["Go",         1000, "#00ADD8"],
      ["Java",        500, "#b07219"],
    ]);
    const result = computeLanguagePercentages(m, 5);
    expect(result.languages).toHaveLength(6); // 5 + Other
    expect(result.languages[0]?.name).toBe("TypeScript");
    expect(result.languages[4]?.name).toBe("Go");
    expect(result.languages[5]?.name).toBe("Other"); // Java grouped
  });

  it("percentages sum approximately to 100", () => {
    const m = buildMap([
      ["JavaScript", 1000, "#f1e05a"],
      ["TypeScript", 2000, "#3178c6"],
      ["Python",     3000, "#3572A5"],
    ]);
    const result = computeLanguagePercentages(m, 5);
    const sum = result.languages.reduce((s, l) => s + l.percentage, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it("handles single language = 100%", () => {
    const m = buildMap([["TypeScript", 9999, "#3178c6"]]);
    const result = computeLanguagePercentages(m, 5);
    expect(result.languages).toHaveLength(1);
    expect(result.languages[0]?.percentage).toBeCloseTo(100, 1);
  });

  it("does not add Other when exactly topN languages exist", () => {
    const m = buildMap([
      ["A", 100, "#111"],
      ["B", 200, "#222"],
      ["C", 300, "#333"],
    ]);
    const result = computeLanguagePercentages(m, 5); // only 3 langs
    expect(result.languages.find((l) => l.name === "Other")).toBeUndefined();
  });
});

describe("normalizeLanguageData", () => {
  it("normalizes percentages to sum to 100", () => {
    const data = {
      totalBytes: 1000,
      languages: [
        { name: "A", color: "#111", bytes: 600, percentage: 60 },
        { name: "B", color: "#222", bytes: 400, percentage: 39 }, // intentionally off
      ],
    };
    const result = normalizeLanguageData(data);
    const sum = result.languages.reduce((s, l) => s + l.percentage, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it("returns empty languages unchanged", () => {
    const data = { totalBytes: 0, languages: [] };
    const result = normalizeLanguageData(data);
    expect(result.languages).toHaveLength(0);
  });
});
