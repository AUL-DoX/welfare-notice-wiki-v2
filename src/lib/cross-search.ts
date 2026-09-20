import henreiRawData from "@/data/henrei-search.json";
import shogaiRawData from "@/data/shogai-error-search.json";
import { type HenreiData, type HenreiEntry, matchesEntry as matchesHenreiEntry } from "@/lib/henrei-search";
import { type ShogaiData, type ShogaiEntry, matchesEntry as matchesShogaiEntry } from "@/lib/shogai-error-search";

const HENREI_DATA = henreiRawData as unknown as HenreiData;
const SHOGAI_DATA = shogaiRawData as unknown as ShogaiData;

export type CrossSearchMatch<TEntry> = {
  key: string;
  entry: TEntry;
};

export type CrossSearchResult = {
  henrei: { total: number; items: CrossSearchMatch<HenreiEntry>[] };
  shogai: { total: number; items: CrossSearchMatch<ShogaiEntry>[] };
};

function tokenize(query: string): string[] {
  return query
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

const PREVIEW_LIMIT = 5;

export function searchOtherTools(query: string): CrossSearchResult {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return { henrei: { total: 0, items: [] }, shogai: { total: 0, items: [] } };
  }

  const henreiKeys = HENREI_DATA.order.filter((key) =>
    tokens.every((token) => matchesHenreiEntry(HENREI_DATA.entries[key], token)),
  );
  const shogaiKeys = SHOGAI_DATA.order.filter((key) =>
    tokens.every((token) => matchesShogaiEntry(SHOGAI_DATA.entries[key], token)),
  );

  return {
    henrei: {
      total: henreiKeys.length,
      items: henreiKeys.slice(0, PREVIEW_LIMIT).map((key) => ({ key, entry: HENREI_DATA.entries[key] })),
    },
    shogai: {
      total: shogaiKeys.length,
      items: shogaiKeys.slice(0, PREVIEW_LIMIT).map((key) => ({ key, entry: SHOGAI_DATA.entries[key] })),
    },
  };
}
