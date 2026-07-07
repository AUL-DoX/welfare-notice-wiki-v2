export interface HenreiEntry {
  code: string | null;
  title: string;
  content?: string;
  pages?: number[];
  retname?: string;
  flag?: string;
  no?: number;
  brief?: boolean;
}

export interface HenreiData {
  order: string[];
  entries: Record<string, HenreiEntry>;
}

export function isBrief(entry: HenreiEntry): boolean {
  return !entry.content;
}

export function matchesEntry(entry: HenreiEntry, normalizedTerm: string): boolean {
  if (!normalizedTerm) return true;
  const hay = `${entry.code ?? ""} ${entry.title} ${entry.content ?? ""} ${entry.retname ?? ""}`.toLowerCase();
  return hay.includes(normalizedTerm);
}

export type ContentBlock =
  | { type: "section"; label: string; text: string }
  | { type: "plain"; text: string }
  | { type: "continuation"; text: string };

const SECTION_LABELS = ["原 因", "原因", "対応方法", "返戻事例", "Point", "POINT", "注 意", "注意", "参 考", "参考"];

export function parseContent(content: string): ContentBlock[] {
  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];
  let buffer: string[] = [];
  let currentLabel: string | null = null;

  const flush = () => {
    if (currentLabel) {
      blocks.push({ type: "section", label: currentLabel, text: buffer.join("\n").trim() });
    } else if (buffer.join("").trim()) {
      blocks.push({ type: "plain", text: buffer.join("\n").trim() });
    }
    buffer = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (/^[－\-—]{5,}$/.test(trimmed)) continue;

    let matchedLabel: string | null = null;
    for (const lab of SECTION_LABELS) {
      if (trimmed === lab || trimmed.startsWith(lab + " ") || trimmed.startsWith(lab + "　")) {
        matchedLabel = lab.replace(/\s/g, "");
        break;
      }
    }
    if (matchedLabel) {
      flush();
      currentLabel = matchedLabel;
      let rest = trimmed;
      for (const lab of SECTION_LABELS) {
        if (rest.startsWith(lab)) {
          rest = rest.slice(lab.length).trim();
          break;
        }
      }
      if (rest) buffer.push(rest);
      continue;
    }

    if (trimmed.startsWith("--- (続き")) {
      flush();
      currentLabel = null;
      blocks.push({ type: "continuation", text: trimmed });
      continue;
    }

    buffer.push(raw);
  }
  flush();

  return blocks.length > 0 ? blocks : [{ type: "plain", text: content }];
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
