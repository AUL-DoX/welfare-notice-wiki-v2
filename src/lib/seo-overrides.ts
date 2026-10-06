import overridesData from "../../data/seo-overrides.json";

export type SeoOverride = {
  /** 検索結果に出る <title>（「｜福祉通知Wiki」は付けない） */
  title: string;
  /** ページ内の H1（省略時は資料タイトル） */
  h1?: string;
  /** meta description（100〜140文字程度が目安） */
  description: string;
  /** ページ冒頭に出す1〜2文の説明（資料が何なのかをHTMLで説明する） */
  intro?: string;
};

const overrides = overridesData as Record<string, SeoOverride>;

/**
 * Search Console で「表示は多いがCTRが低い」ページの title / description を
 * 個別に上書きするための設定（data/seo-overrides.json、キーは slug）。
 * URL（slug）は変えず、検索結果での見え方だけを改善する。
 */
export function getSeoOverride(slug: string): SeoOverride | null {
  return overrides[slug] ?? null;
}
