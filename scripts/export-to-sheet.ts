/**
 * 現在の全文書（uploadedAt / slug / title / category / keywords）を
 * Googleスプレッドシートへ書き出す。既存のシートの内容は上書きされる。
 * category列にはドロップダウン（選択式）の入力規則も設定する。
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
import { writeSheetRows, setColumnDropdown, clearAllDataValidation } from "../src/lib/google-sheets";
import { DOCUMENT_CATEGORY_LABELS } from "../src/lib/document-categories";

const BASELINE_FILE_PATH = path.join(process.cwd(), "data", "sheet-sync-baseline.json");
const HEADER = ["uploadedAt", "slug", "title", "category", "keywords"];
const CATEGORY_COLUMN_INDEX = HEADER.indexOf("category");

export type SheetBaseline = Record<string, { category: string; keywords: string }>;

function formatUploadedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export async function buildSheetRowsAndBaseline() {
  const { documents } = await getDocumentIndex();

  const rows: string[][] = [HEADER];
  const baseline: SheetBaseline = {};

  for (const doc of documents) {
    const categoryLabel = DOCUMENT_CATEGORY_LABELS[doc.category];
    const keywords = doc.manualKeywords.join(", ");
    rows.push([formatUploadedAt(doc.uploadedAt), doc.slug, doc.title, categoryLabel, keywords]);
    baseline[doc.slug] = { category: categoryLabel, keywords };
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

  // 列構成が変わった場合などに、古い入力規則が別の列へ残留するのを防ぐため
  // 一旦シート全体をクリアしてから、category列にだけ設定し直す。
  const endRow = Math.max(rows.length + 200, 500);
  await clearAllDataValidation({ endRow });
  await setColumnDropdown(CATEGORY_COLUMN_INDEX, Object.values(DOCUMENT_CATEGORY_LABELS), { endRow });

  console.log(`${rows.length - 1}件をスプレッドシートへ書き出し、基準値を保存しました。`);
}

if (process.argv[1] && process.argv[1].endsWith("export-to-sheet.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
