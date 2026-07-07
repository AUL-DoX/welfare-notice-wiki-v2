import fs from "node:fs/promises";
import path from "node:path";
import { SUPPORTED_EXTENSIONS } from "@/lib/documents";

export type WatchLinkItem = {
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

async function writeData(data: WatchLinksData) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function getWatchLinks(): Promise<WatchLinkItem[]> {
  const data = await readData();
  return data.items.slice().sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
}

export async function getWatchLinkById(id: string): Promise<WatchLinkItem | null> {
  const data = await readData();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function markWatchLinkPromoted(id: string, slug: string): Promise<void> {
  const data = await readData();
  const item = data.items.find((entry) => entry.id === id);
  if (!item) {
    throw new Error("watch link not found");
  }
  item.promotedSlug = slug;
  await writeData(data);
}

export function isDownloadableUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return SUPPORTED_EXTENSIONS.some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
}
