// 厚労省等の古い文書は文字間に全角/半角スペースを挟んで組版されていることが多く、
// また検索語も全角英数字で入力されることがある。表示用の原文は変更せず、
// 検索マッチング専用にNFKC正規化＋横方向の空白除去を行う。
export function normalizeForSearch(text: string): string {
  return text.normalize("NFKC").replace(/[ \t]+/g, "");
}
