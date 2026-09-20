import { getDocumentIndex } from "@/lib/documents";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/lib/document-categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wn-wiki.aul-dox.jp";
  const { documents } = await getDocumentIndex();

  const byCategory = new Map<DocumentCategory, typeof documents>();
  for (const doc of documents) {
    const list = byCategory.get(doc.category) ?? [];
    list.push(doc);
    byCategory.set(doc.category, list);
  }

  const order: DocumentCategory[] = ["care", "disability", "common", "unclassified"];

  const lines: string[] = [];
  lines.push("# 介護と障害福祉サービスの通知文Wiki");
  lines.push("");
  lines.push(
    "> 介護保険サービスおよび障害福祉サービスに関する厚生労働省・自治体の通知文・様式・実態統計データを検索できるWikiです。原文の該当箇所を強調表示して閲覧できます。"
  );
  lines.push("");
  lines.push(`収録文書数: ${documents.length}件（最終更新: ${new Date().toISOString().slice(0, 10)}）`);
  lines.push("");

  for (const cat of order) {
    const docs = byCategory.get(cat);
    if (!docs || docs.length === 0) continue;

    lines.push(`## ${DOCUMENT_CATEGORY_LABELS[cat]}`);
    lines.push("");
    for (const doc of docs) {
      const url = `${BASE_URL}/docs/${encodeURIComponent(doc.slug)}`;
      const summary = doc.summary?.trim() ? `: ${doc.summary.trim().slice(0, 120)}` : "";
      lines.push(`- [${doc.title}](${url})${summary}`);
    }
    lines.push("");
  }

  lines.push("## その他");
  lines.push("");
  lines.push(`- [全文検索](${BASE_URL}/)`);
  lines.push(`- [Sitemap](${BASE_URL}/sitemap.xml)`);
  lines.push("");

  const body = lines.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
