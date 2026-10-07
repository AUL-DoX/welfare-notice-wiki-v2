import redirectsData from "../../data/slug-redirects.json";

const redirects = redirectsData as Record<string, string>;

/**
 * 資料のURL（slug）が変わったとき（例: 長すぎるファイル名の短縮）に、検索結果や
 * ブックマークに残った古いURLを新しいURLへ恒久転送するための対応表
 * （data/slug-redirects.json、キー=古いslug、値=新しいslug）。
 * 対応表にないslugは、そのまま404になる。
 */
export function getRedirectedSlug(oldSlug: string): string | null {
  return redirects[oldSlug] ?? null;
}
