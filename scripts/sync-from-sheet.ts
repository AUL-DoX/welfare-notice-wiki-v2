/**
 * Googleスプレッドシート（slug / title / category / keywords）を読み込み、
 * category と keywords の変更を data/document-categories.json と
 * data/document-keywords.json に反映してインデックスを再生成、
 * コミット＆pushする。
 *
 * 既定では「何件変更があるか」を表示するだけで、実際には書き込まない
 * （ドライラン）。反映するには --apply を付けて実行する。
 *
 * 実行: npm run sync-from-sheet            （確認のみ）
 *       npm run sync-from-sheet -- --apply （実際に反映）
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readSheetRows } from "../src/lib/google-sheets";
import { generateDocumentIndexFile, getDocumentIndex } from "../src/lib/documents";
import { DOCUMENT_CATEGORY_LABELS } from "../src/lib/document-categories";

const execFileAsync = promisify(execFile);
const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORY_FILE_PATH = path.join(DATA_DIR, "document-categories.json");
const KEYWORDS_FILE_PATH = path.join(DATA_DIR, "document-keywords.json");

type KeywordMap = Record<string, { manualKeywords: string[] }>;

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function main() {
  const rows = await readSheetRows();
  if (rows.length < 2) {
    console.log("シートにデータがありません。");
    return;
  }

  const [header, ...dataRows] = rows;
  const slugIdx = header.indexOf("slug");
  const categoryIdx = header.indexOf("category");
  const keywordsIdx = header.indexOf("keywords");

  if (slugIdx === -1) {
    throw new Error("ヘッダー行に slug 列が見つかりません。1行目を確認してください。");
  }

  const categoryMap = await readJson<Record<string, string>>(CATEGORY_FILE_PATH, {});
  const keywordMap = await readJson<KeywordMap>(KEYWORDS_FILE_PATH, {});

  // 「変更があったか」は、上書きファイル（部分的にしか記録がない）ではなく、
  // 今実際にサイトへ出ている値（＝exportスクリプトがシートに書き出した値と
  // 同じもの）と比較する。そうしないと、まだ一度も上書きしていない大多数の
  // 文書が毎回「変更あり」と誤検知されてしまう。
  const { documents: currentDocuments } = await getDocumentIndex();
  const currentBySlug = new Map(currentDocuments.map((doc) => [doc.slug, doc]));

  let categoryChanges = 0;
  let keywordChanges = 0;

  for (const row of dataRows) {
    const slug = row[slugIdx]?.trim();
    if (!slug) continue;

    const current = currentBySlug.get(slug);

    if (categoryIdx !== -1) {
      const category = row[categoryIdx]?.trim();
      if (category && category in DOCUMENT_CATEGORY_LABELS && current && current.category !== category) {
        categoryMap[slug] = category;
        categoryChanges += 1;
      }
    }

    if (keywordsIdx !== -1) {
      const raw = row[keywordsIdx]?.trim();
      if (raw && current) {
        // export-to-sheet.ts は半角カンマ+スペース（", "）で結合しているため、
        // 読み込み側もそれだけを区切りとする。全角「、」も区切りに含めると、
        // キーワード自体に「、」が含まれるケース（例:「A、B」という1語）を
        // 誤って分割してしまう。
        const keywords = Array.from(
          new Set(
            raw
              .split(",")
              .map((keyword) => keyword.trim())
              .filter(Boolean)
              .slice(0, 20),
          ),
        );
        const existing = current.manualKeywords;
        if (keywords.length > 0 && JSON.stringify(keywords) !== JSON.stringify(existing)) {
          keywordMap[slug] = { manualKeywords: keywords };
          keywordChanges += 1;
        }
      }
    }
  }

  if (categoryChanges === 0 && keywordChanges === 0) {
    console.log("シートに前回からの変更はありませんでした。");
    return;
  }

  const apply = process.argv.includes("--apply");
  if (!apply) {
    console.log(`カテゴリ変更: ${categoryChanges}件 / キーワード変更: ${keywordChanges}件（ドライラン、まだ反映していません）`);
    console.log("この内容を反映するには: npm run sync-from-sheet -- --apply");
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  if (categoryChanges > 0) {
    await fs.writeFile(CATEGORY_FILE_PATH, `${JSON.stringify(categoryMap, null, 2)}\n`, "utf8");
  }
  if (keywordChanges > 0) {
    await fs.writeFile(KEYWORDS_FILE_PATH, `${JSON.stringify(keywordMap, null, 2)}\n`, "utf8");
  }

  console.log(`カテゴリ変更: ${categoryChanges}件 / キーワード変更: ${keywordChanges}件`);
  console.log("インデックスを再生成中...");
  await generateDocumentIndexFile();

  const cwd = process.cwd();
  const filesToCommit = [
    ...(categoryChanges > 0 ? [path.join("data", "document-categories.json")] : []),
    ...(keywordChanges > 0 ? [path.join("data", "document-keywords.json")] : []),
    path.join("data", "document-index.json"),
    path.join("data", "document-files.json"),
  ];

  await execFileAsync("git", ["add", ...filesToCommit], { cwd });
  await execFileAsync(
    "git",
    ["commit", "-m", `Sync from spreadsheet: category x${categoryChanges}, keywords x${keywordChanges}`],
    { cwd },
  );

  // Obsidianの自動pushなどと競合していても自動で解消してからpushする。
  await execFileAsync("git", ["pull", "--rebase", "--autostash", "origin", "main"], { cwd });
  await execFileAsync("git", ["push"], { cwd });

  console.log("コミット＆pushしました。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
