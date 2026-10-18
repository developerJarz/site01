/**
 * A 0–100 SEO score for one page, from what Google and social apps actually read: the title,
 * the meta description, keyword use, the share image and whether the page may be indexed.
 * Pure and dependency-free so the admin page can score as you type and tests can pin the rules.
 */

export type CheckStatus = "pass" | "warn" | "fail";
export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  tip: string;
  weight: number;
}

export interface ScoreInput {
  title: string;
  description: string;
  keywords: string[];
  /** A page-specific share image (not just the site default). */
  ownImage: boolean;
  /** The site has a default share image to fall back on. */
  defaultImage: boolean;
  noindex: boolean;
  /** The page is meant to stay out of Google (account pages and the like). */
  hiddenByDesign?: boolean;
}

const VALUE: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

const between = (n: number, [goodMin, goodMax]: [number, number], [okMin, okMax]: [number, number]): CheckStatus =>
  n >= goodMin && n <= goodMax ? "pass" : n >= okMin && n <= okMax ? "warn" : "fail";

const mentions = (haystack: string, keyword: string) => {
  const h = haystack.toLowerCase();
  const k = keyword.toLowerCase().trim();
  if (!k) return false;
  if (h.includes(k)) return true;
  // "used car price bangladesh" still counts when the words appear in a slightly different order.
  const words = k.split(/\s+/).filter((w) => w.length > 2);
  return words.length > 1 && words.every((w) => h.includes(w));
};

export function scorePage(input: ScoreInput): { score: number; checks: SeoCheck[] } {
  const title = input.title.trim();
  const description = input.description.trim();
  const keywords = input.keywords.map((k) => k.trim()).filter(Boolean);
  const main = keywords[0] || "";

  if (input.noindex && input.hiddenByDesign) {
    return {
      score: 100,
      checks: [{ id: "indexing", label: "Hidden from Google on purpose", status: "pass", weight: 1, tip: "This page isn't meant to appear in search results." }],
    };
  }

  const checks: SeoCheck[] = [
    {
      id: "title-length",
      label: `Title length (${title.length} characters)`,
      status: between(title.length, [30, 60], [20, 70]),
      weight: 25,
      tip: title.length > 60 ? "Google cuts titles after about 60 characters. Put the important words first." : "Aim for 30–60 characters so the title fills the search result.",
    },
    {
      id: "description-length",
      label: `Meta description length (${description.length} characters)`,
      status: between(description.length, [70, 158], [50, 200]),
      weight: 25,
      tip: description.length > 158 ? "Google shows about 158 characters; the rest is cut off." : "Write 70–158 characters that tell searchers what they'll find and why to click.",
    },
    {
      id: "keywords",
      label: keywords.length ? `Focus keywords set (${keywords.length})` : "No focus keywords",
      status: keywords.length ? "pass" : "warn",
      weight: 10,
      tip: "Add the phrases people type into Google for this page, e.g. “used car price in Bangladesh”.",
    },
    {
      id: "keyword-title",
      label: main ? `Main keyword “${main}” in the title` : "Main keyword in the title",
      status: !main ? "warn" : mentions(title, main) ? "pass" : keywords.some((k) => mentions(title, k)) ? "warn" : "fail",
      weight: 15,
      tip: "Use your first keyword naturally in the title, near the start.",
    },
    {
      id: "keyword-description",
      label: main ? `Main keyword “${main}” in the description` : "Main keyword in the description",
      status: !main ? "warn" : mentions(description, main) ? "pass" : keywords.some((k) => mentions(description, k)) ? "warn" : "fail",
      weight: 10,
      tip: "Mention the keyword once in the description; Google highlights it in bold.",
    },
    {
      id: "share-image",
      label: input.ownImage ? "Own share image" : input.defaultImage ? "Uses the site's default share image" : "No share image",
      status: input.ownImage ? "pass" : input.defaultImage ? "warn" : "fail",
      weight: 10,
      tip: "A 1200 × 630 image made for this page gets more clicks on Facebook and WhatsApp.",
    },
    {
      id: "indexing",
      label: input.noindex ? "Hidden from Google" : "Visible to Google",
      status: input.noindex ? "fail" : "pass",
      weight: 5,
      tip: "Untick “Hide from Google” unless the page really shouldn't appear in search.",
    },
  ];

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.reduce((n, c) => n + c.weight * VALUE[c.status], 0);
  return { score: Math.round((earned / total) * 100), checks };
}

export const scoreGrade = (score: number) =>
  score >= 85 ? { label: "Good", tone: "good" as const } : score >= 60 ? { label: "Needs work", tone: "ok" as const } : { label: "Poor", tone: "poor" as const };
