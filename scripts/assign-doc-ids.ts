import fs from "node:fs/promises";
import path from "node:path";
import { formatAulDocId } from "../src/lib/aul-doc-id";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCUMENT_INDEX_FILE_PATH = path.join(DATA_DIR, "document-index.json");
const DOC_IDS_FILE_PATH = path.join(DATA_DIR, "doc-ids.json");

type DocIdEntry = {
  docId: string;
  sequence: number;
  assignedAt: string;
};

type DocIdMap = Record<string, DocIdEntry>; // slug -> entry

async function main() {
  const indexRaw = await fs.readFile(DOCUMENT_INDEX_FILE_PATH, "utf8");
  const index = JSON.parse(indexRaw) as { documents: Array<{ slug: string }> };

  let existing: DocIdMap = {};
  try {
    existing = JSON.parse(await fs.readFile(DOC_IDS_FILE_PATH, "utf8")) as DocIdMap;
  } catch {
    existing = {};
  }

  let nextSequence =
    Object.values(existing).reduce((max, entry) => Math.max(max, entry.sequence), 0) + 1;

  let assignedCount = 0;
  const now = new Date().toISOString();

  for (const doc of index.documents) {
    if (existing[doc.slug]) continue;
    existing[doc.slug] = {
      docId: formatAulDocId(nextSequence),
      sequence: nextSequence,
      assignedAt: now,
    };
    nextSequence += 1;
    assignedCount += 1;
  }

  const sortedEntries = Object.entries(existing).sort((a, b) => a[1].sequence - b[1].sequence);
  const sorted: DocIdMap = Object.fromEntries(sortedEntries);

  await fs.writeFile(DOC_IDS_FILE_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");

  console.log(
    `Assigned ${assignedCount} new AUL DoX doc-id(s). Total=${sortedEntries.length}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
