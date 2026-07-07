import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { requireAdminMode } from "@/lib/admin";
import { generateDocumentIndexFile, slugify, SOURCE_DOCS_DIR, SUPPORTED_EXTENSIONS } from "@/lib/documents";
import { getWatchLinkById, isDownloadableUrl, markWatchLinkPromoted } from "@/lib/watch-links";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  try {
    requireAdminMode(request);
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const item = await getWatchLinkById(body.id);
    if (!item) {
      return NextResponse.json({ error: "watch link not found" }, { status: 404 });
    }

    if (item.promotedSlug) {
      return NextResponse.json({ slug: item.promotedSlug, url: `/docs/${item.promotedSlug}` });
    }

    if (!isDownloadableUrl(item.url)) {
      return NextResponse.json(
        { error: "このリンクはPDF等のファイルではないため保存できません。" },
        { status: 400 },
      );
    }

    const extension = SUPPORTED_EXTENSIONS.find((ext) => new URL(item.url).pathname.toLowerCase().endsWith(ext))!;

    const response = await fetch(item.url);
    if (!response.ok) {
      return NextResponse.json({ error: `ダウンロードに失敗しました（HTTP ${response.status}）。` }, { status: 502 });
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const fileName = await resolveFileName(item.title, extension);
    const year = String(new Date().getFullYear());
    const targetDir = path.join(SOURCE_DOCS_DIR, year);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, fileName), buffer);

    await generateDocumentIndexFile();

    const slug = slugify(fileName);
    await markWatchLinkPromoted(item.id, slug);

    await gitCommitAndPush([
      path.join("source-docs", year, fileName),
      path.join("data", "document-metadata.json"),
      path.join("data", "document-index.json"),
      path.join("data", "watch-links.json"),
    ], `Promote watch link: ${item.title}`);

    return NextResponse.json({ slug, url: `/docs/${slug}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to promote watch link" },
      { status: 500 },
    );
  }
}

async function resolveFileName(title: string, extension: string): Promise<string> {
  const sanitized = title
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
  const base = sanitized || "無題";
  const year = String(new Date().getFullYear());
  const targetDir = path.join(SOURCE_DOCS_DIR, year);

  let candidate = `${base}${extension}`;
  let suffix = 2;
  while (await fileExists(path.join(targetDir, candidate))) {
    candidate = `${base}-${suffix}${extension}`;
    suffix += 1;
  }

  return candidate;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function gitCommitAndPush(files: string[], message: string): Promise<void> {
  const cwd = process.cwd();
  await execFileAsync("git", ["add", ...files], { cwd });
  await execFileAsync("git", ["commit", "-m", message], { cwd });
  await execFileAsync("git", ["push"], { cwd });
}
