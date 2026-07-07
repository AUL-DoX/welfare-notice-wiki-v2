import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

type WatchLinkItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  collectedAt: string;
  promotedSlug: string | null;
};

type WatchLinksData = {
  items: WatchLinkItem[];
};

const DATA_PATH = path.join(process.cwd(), "data", "watch-links.json");

function makeId(url: string): string {
  return crypto.createHash("sha1").update(url).digest("hex").slice(0, 16);
}

function parseReport(markdown: string): Array<Omit<WatchLinkItem, "id" | "promotedSlug" | "collectedAt">> {
  const items: Array<Omit<WatchLinkItem, "id" | "promotedSlug" | "collectedAt">> = [];
  let currentSource: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+\[(.+?)\]\(.+?\)/) ?? line.match(/^##\s+(.+)$/);
    if (heading) {
      currentSource = heading[1].trim();
      continue;
    }

    const item = line.match(/^-\s+\[(.+?)\]\((.+?)\)/);
    if (item && currentSource) {
      items.push({ source: currentSource, title: item[1].trim(), url: item[2].trim() });
    }
  }

  return items;
}

async function readData(): Promise<WatchLinksData> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as WatchLinksData;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { items: [] };
    }
    throw error;
  }
}

async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error("Usage: tsx scripts/ingest-watch-links.ts <report-markdown-path>");
    process.exitCode = 1;
    return;
  }

  const markdown = await fs.readFile(reportPath, "utf8");
  const dateMatch = path.basename(reportPath).match(/(\d{4}-\d{2}-\d{2})/);
  const collectedAt = dateMatch
    ? new Date(`${dateMatch[1]}T00:00:00+09:00`).toISOString()
    : new Date().toISOString();

  const parsed = parseReport(markdown);
  const data = await readData();
  const existingUrls = new Set(data.items.map((item) => item.url));

  let addedCount = 0;
  for (const entry of parsed) {
    if (existingUrls.has(entry.url)) continue;
    data.items.push({ ...entry, id: makeId(entry.url), collectedAt, promotedSlug: null });
    existingUrls.add(entry.url);
    addedCount += 1;
  }

  data.items.sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`Added ${addedCount} new watch link(s). Total: ${data.items.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
