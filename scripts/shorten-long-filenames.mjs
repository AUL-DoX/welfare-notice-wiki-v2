import { execFileSync } from "node:child_process";
import path from "node:path";

// Fixed budget for the filename *stem* (basename minus extension), independent of
// extension length. This matters because source-docs/meta/{stem}.md files are matched
// to their source-docs/**/{stem}.{ext} counterpart purely by stem equality (see
// loadMetaFrontmatter in src/lib/documents.ts) -- if the stem were truncated differently
// per extension, the pdf/xlsx file and its .md metadata would fall out of sync.
const MAX_STEM_BYTES = 170;
const TRIGGER_BASENAME_BYTES = 180;

function byteLength(str) {
  return Buffer.byteLength(str, "utf8");
}

function truncateToBytes(str, maxBytes) {
  let result = "";
  let bytes = 0;
  for (const ch of str) {
    const chBytes = Buffer.byteLength(ch, "utf8");
    if (bytes + chBytes > maxBytes) break;
    result += ch;
    bytes += chBytes;
  }
  return result.trim();
}

const tracked = execFileSync("git", ["ls-tree", "-r", "-z", "--name-only", "HEAD"], {
  cwd: process.cwd(),
  maxBuffer: 1024 * 1024 * 50,
})
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const byStem = new Map();
for (const filePath of tracked) {
  const ext = path.extname(filePath);
  const stem = path.basename(filePath, ext);
  const list = byStem.get(stem) ?? [];
  list.push(filePath);
  byStem.set(stem, list);
}

const stemsNeedingShortening = [...byStem.entries()].filter(([, filePaths]) =>
  filePaths.some((filePath) => byteLength(path.basename(filePath)) > TRIGGER_BASENAME_BYTES),
);

console.log(`Found ${stemsNeedingShortening.length} stem(s) needing shortening (${stemsNeedingShortening.reduce((n, [, fp]) => n + fp.length, 0)} file(s)).`);

const usedNames = new Set(tracked);
const usedStems = new Set(byStem.keys());
let renamedCount = 0;

for (const [stem, filePaths] of stemsNeedingShortening) {
  let shortenedStem = truncateToBytes(stem, MAX_STEM_BYTES);

  let suffix = 2;
  while (usedStems.has(shortenedStem) && shortenedStem !== stem) {
    const suffixStr = `-${suffix}`;
    shortenedStem = `${truncateToBytes(stem, MAX_STEM_BYTES - byteLength(suffixStr))}${suffixStr}`;
    suffix += 1;
  }
  usedStems.add(shortenedStem);

  for (const filePath of filePaths) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const candidate = path.join(dir, `${shortenedStem}${ext}`).split(path.sep).join("/");

    if (candidate === filePath) continue;

    usedNames.delete(filePath);
    usedNames.add(candidate);

    execFileSync("git", ["mv", filePath, candidate], { cwd: process.cwd() });
    console.log(`  renamed (${byteLength(path.basename(filePath))}B -> ${byteLength(path.basename(candidate))}B):`);
    console.log(`    ${filePath}`);
    console.log(`    -> ${candidate}`);
    renamedCount += 1;
  }
}

console.log(`Done. Renamed ${renamedCount} file(s) across ${stemsNeedingShortening.length} stem(s).`);
