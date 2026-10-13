import type { MetadataRoute } from "next";
import { getDocumentIndex } from "@/lib/documents";
import { errorPath, getErrors, servicePath } from "@/lib/kokuhoren-errors";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wn-wiki.aul-dox.jp";

  const { documents } = await getDocumentIndex();

  const docEntries: MetadataRoute.Sitemap = documents.map((doc) => ({
    url: `${BASE_URL}/docs/${encodeURIComponent(doc.slug)}`,
    lastModified: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // 原因・対応方法まで解説している個別ページだけを載せる（一覧のみの簡易ページは noindex）
  const errorEntries: MetadataRoute.Sitemap = [
    ...(["kaigo", "shogai"] as const).map((s) => ({
      url: `${BASE_URL}${servicePath(s)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...(["kaigo", "shogai"] as const).flatMap((s) =>
      getErrors(s)
        .filter((e) => e.detailed)
        .map((e) => ({
          url: `${BASE_URL}${errorPath(e)}`,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        })),
    ),
  ];

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/henrei-guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/kokuhoren-error`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...errorEntries,
    ...docEntries,
  ];
}
