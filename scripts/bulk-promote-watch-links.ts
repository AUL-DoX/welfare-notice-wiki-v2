import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { generateDocumentIndexFile, slugify, SOURCE_DOCS_DIR, SUPPORTED_EXTENSIONS } from "../src/lib/documents";

const execFileAsync = promisify(execFile);
const DATA_PATH = path.join(process.cwd(), "data", "watch-links.json");

type WatchLinkItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  collectedAt: string;
  promotedSlug: string | null;
};

function isDownloadableUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return SUPPORTED_EXTENSIONS.some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const MAX_FILENAME_BASE_BYTES = 170;

function truncateToBytes(text: string, maxBytes: number): string {
  let result = "";
  let bytes = 0;
  for (const ch of text) {
    const chBytes = Buffer.byteLength(ch, "utf8");
    if (bytes + chBytes > maxBytes) break;
    result += ch;
    bytes += chBytes;
  }
  return result.trim();
}

async function resolveFileName(title: string, extension: string, targetDir: string): Promise<string> {
  const sanitized = truncateToBytes(
    title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim(),
    MAX_FILENAME_BASE_BYTES,
  );
  const base = sanitized || "無題";

  let candidate = `${base}${extension}`;
  let suffix = 2;
  while (await fileExists(path.join(targetDir, candidate))) {
    candidate = `${base}-${suffix}${extension}`;
    suffix += 1;
  }

  return candidate;
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const data = JSON.parse(raw) as { items: WatchLinkItem[] };

  const targets = data.items.filter((item) => !item.promotedSlug && isDownloadableUrl(item.url));
  console.log(`Promoting ${targets.length} item(s)...`);

  const year = String(new Date().getFullYear());
  const targetDir = path.join(SOURCE_DOCS_DIR, year);
  await fs.mkdir(targetDir, { recursive: true });

  const committedFiles: string[] = [];

  for (const item of targets) {
    try {
      const extension = SUPPORTED_EXTENSIONS.find((ext) => new URL(item.url).pathname.toLowerCase().endsWith(ext))!;
      const response = await fetch(item.url);
      if (!response.ok) {
        console.error(`  skip (HTTP ${response.status}): ${item.title}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const fileName = await resolveFileName(item.title, extension, targetDir);
      await fs.writeFile(path.join(targetDir, fileName), buffer);

      const slug = slugify(fileName);
      item.promotedSlug = slug;
      committedFiles.push(path.join("source-docs", year, fileName));
      console.log(`  saved: ${fileName}`);
    } catch (error) {
      console.error(`  error (${item.title}):`, error instanceof Error ? error.message : error);
    }
  }

  await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log("Regenerating document index...");
  await generateDocumentIndexFile();

  if (committedFiles.length > 0) {
    const cwd = process.cwd();
    await execFileAsync("git", [
      "add",
      ...committedFiles,
      path.join("data", "document-metadata.json"),
      path.join("data", "document-index.json"),
      path.join("data", "watch-links.json"),
    ], { cwd });
    await execFileAsync("git", ["commit", "-m", `Bulk-promote ${committedFiles.length} watch link(s)`], { cwd });
    console.log(`Committed ${committedFiles.length} file(s).`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
