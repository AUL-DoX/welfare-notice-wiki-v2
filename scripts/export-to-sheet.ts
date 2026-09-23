/**
 * 現在の全文書（slug / title / category / keywords）をGoogleスプレッドシートへ
 * 書き出す。最初の1回だけ実行して、手入力の手間なく編集の土台を作る想定。
 * 既存のシートの内容は上書きされる。
 *
 * 実行: npm run export-to-sheet
 */
import { getDocumentIndex } from "../src/lib/documents";
import { writeSheetRows } from "../src/lib/google-sheets";

async function main() {
  const { documents } = await getDocumentIndex();

  const header = ["slug", "title", "category", "keywords"];
  const rows = documents.map((doc) => [doc.slug, doc.title, doc.category, doc.manualKeywords.join(", ")]);

  await writeSheetRows([header, ...rows]);
  console.log(`${rows.length}件をスプレッドシートへ書き出しました。`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
