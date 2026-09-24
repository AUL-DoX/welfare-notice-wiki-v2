/**
 * 現在の全文書（slug / title / category / keywords）をGoogleスプレッドシートへ
 * 書き出す。既存のシートの内容は上書きされる。
 *
 * 同時に「基準値」（data/sheet-sync-baseline.json）も保存する。この基準値は
 * sync-from-sheet.ts が「シートで本当に人が編集したセルはどれか」を判定する
 * ために使う。これにより、/admin で設定した値がシートに反映されていなくても、
 * 次のシート同期で誤って上書きされることがなくなる（シート側は基準値のまま
 * ＝未編集、と判定されるため）。
 *
 * 実行: npm run export-to-sheet
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getDocumentIndex } from "../src/lib/documents";
import { writeSheetRows } from "../src/lib/google-sheets";

const BASELINE_FILE_PATH = path.join(process.cwd(), "data", "sheet-sync-baseline.json");

export type SheetBaseline = Record<string, { category: string; keywords: string }>;

export async function buildSheetRowsAndBaseline() {
  const { documents } = await getDocumentIndex();

  const header = ["slug", "title", "category", "keywords"];
  const rows: string[][] = [header];
  const baseline: SheetBaseline = {};

  for (const doc of documents) {
    const keywords = doc.manualKeywords.join(", ");
    rows.push([doc.slug, doc.title, doc.category, keywords]);
    baseline[doc.slug] = { category: doc.category, keywords };
  }

  return { rows, baseline };
}

export async function writeBaseline(baseline: SheetBaseline) {
  await fs.mkdir(path.dirname(BASELINE_FILE_PATH), { recursive: true });
  await fs.writeFile(BASELINE_FILE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
}

async function main() {
  const { rows, baseline } = await buildSheetRowsAndBaseline();

  await writeSheetRows(rows);
  await writeBaseline(baseline);

  console.log(`${rows.length - 1}件をスプレッドシートへ書き出し、基準値を保存しました。`);
}

if (process.argv[1] && process.argv[1].endsWith("export-to-sheet.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
