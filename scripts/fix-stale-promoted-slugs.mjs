import fs from "node:fs/promises";
import path from "node:path";

const WATCH_LINKS_PATH = path.join(process.cwd(), "data", "watch-links.json");
const DOCUMENT_INDEX_PATH = path.join(process.cwd(), "data", "document-index.json");

const watchLinks = JSON.parse(await fs.readFile(WATCH_LINKS_PATH, "utf8"));
const documentIndex = JSON.parse(await fs.readFile(DOCUMENT_INDEX_PATH, "utf8"));

const validSlugs = new Set(documentIndex.documents.map((doc) => doc.slug));
const docsByFileName = new Map(documentIndex.documents.map((doc) => [doc.fileName, doc.slug]));

function normalizeForMatch(text) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

let fixed = 0;
let unresolved = 0;

for (const item of watchLinks.items) {
  if (!item.promotedSlug || validSlugs.has(item.promotedSlug)) continue;

  const target = normalizeForMatch(item.title);
  let matchSlug = null;

  for (const [fileName, slug] of docsByFileName) {
    const base = fileName.replace(/\.[^.]+$/, "");
    if (normalizeForMatch(base).startsWith(target.slice(0, 40)) || target.startsWith(normalizeForMatch(base).slice(0, 40))) {
      matchSlug = slug;
      break;
    }
  }

  if (matchSlug) {
    console.log(`  fixed: ${item.promotedSlug}\n      -> ${matchSlug}`);
    item.promotedSlug = matchSlug;
    fixed += 1;
  } else {
    console.log(`  UNRESOLVED: ${item.title}`);
    unresolved += 1;
  }
}

await fs.writeFile(WATCH_LINKS_PATH, `${JSON.stringify(watchLinks, null, 2)}\n`, "utf8");
console.log(`Done. Fixed=${fixed} Unresolved=${unresolved}`);
