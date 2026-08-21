export interface ShogaiEntry {
  code: string;
  title: string;
  cause?: string;
  remedy?: string;
  brief?: boolean;
  source?: "r8" | "r9";
}

export interface ShogaiData {
  order: string[];
  entries: Record<string, ShogaiEntry>;
}

export function isBrief(entry: ShogaiEntry): boolean {
  return !!entry.brief;
}

export function matchesEntry(entry: ShogaiEntry, normalizedTerm: string): boolean {
  if (!normalizedTerm) return true;
  const hay = `${entry.code} ${entry.title} ${entry.cause ?? ""} ${entry.remedy ?? ""}`.toLowerCase();
  return hay.includes(normalizedTerm);
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

export function highlightParts(text: string, rawTerm: string): HighlightPart[] {
  if (!rawTerm) return [{ text, match: false }];
  const safeTerm = rawTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safeTerm})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) => ({ text: part, match: i % 2 === 1 })).filter((part) => part.text !== "");
}
