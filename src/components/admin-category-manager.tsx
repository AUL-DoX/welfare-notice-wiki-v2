"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/lib/document-categories";

export type AdminDocument = {
  slug: string;
  title: string;
  category: DocumentCategory;
  uploadedAt: string;
  sourceType: string;
  issuer: string | null;
};

const CATEGORY_ORDER: DocumentCategory[] = ["unclassified", "care", "disability", "common"];
type FilterKey = DocumentCategory | "all";

export function AdminCategoryManager({ documents }: { documents: AdminDocument[] }) {
  const [docs, setDocs] = useState<AdminDocument[]>(documents);
  const [filter, setFilter] = useState<FilterKey>("unclassified");
  const [query, setQuery] = useState("");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<{ slug: string; category: DocumentCategory } | null>(null);

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = { all: docs.length, unclassified: 0, care: 0, disability: 0, common: 0 };
    for (const doc of docs) {
      base[doc.category] += 1;
    }
    return base;
  }, [docs]);

  const visibleDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const matchesFilter = filter === "all" || doc.category === filter;
      if (!matchesFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return `${doc.title} ${doc.issuer ?? ""}`.toLowerCase().includes(normalizedQuery);
    });
  }, [docs, filter, query]);

  async function classify(slug: string, nextCategory: DocumentCategory) {
    const target = docs.find((doc) => doc.slug === slug);
    if (!target || target.category === nextCategory) {
      return;
    }

    const previousCategory = target.category;
    setSavingSlug(slug);
    setError(null);
    // 楽観的更新
    setDocs((current) => current.map((doc) => (doc.slug === slug ? { ...doc, category: nextCategory } : doc)));

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, category: nextCategory }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "カテゴリの保存に失敗しました。");
      }

      setJustSaved({ slug, category: nextCategory });
      window.setTimeout(() => setJustSaved((state) => (state?.slug === slug ? null : state)), 4000);
    } catch (saveError) {
      // 失敗したら元に戻す
      setDocs((current) => current.map((doc) => (doc.slug === slug ? { ...doc, category: previousCategory } : doc)));
      setError(saveError instanceof Error ? saveError.message : "カテゴリの保存に失敗しました。");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["unclassified", "care", "disability", "common", "all"] as FilterKey[]).map((key) => {
          const isActive = key === filter;
          const label = key === "all" ? "すべて" : DOCUMENT_CATEGORY_LABELS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition md:text-base",
                isActive
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50",
              ].join(" ")}
            >
              {label}
              <span className={isActive ? "ml-2 text-stone-300" : "ml-2 text-stone-400"}>{counts[key]}</span>
            </button>
          );
        })}
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="タイトルで絞り込み（例: 処遇改善 交付要綱）"
        className="w-full rounded-full border-2 border-stone-300 bg-stone-50 px-5 py-3 text-base outline-none transition focus:border-amber-700 focus:bg-white"
      />

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <p className="text-sm text-stone-600">
        {filter === "unclassified"
          ? `未分類 ${counts.unclassified} 件。カテゴリを押すと保存され、本番サイトへ反映されます（デプロイに1〜2分）。`
          : `${visibleDocs.length} 件を表示中。`}
      </p>

      <div className="flex flex-col gap-3">
        {visibleDocs.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-stone-600">
            {filter === "unclassified"
              ? "未分類の文書はありません。すべて分類済みです。"
              : "該当する文書がありません。"}
          </div>
        ) : (
          visibleDocs.map((doc) => (
            <div
              key={doc.slug}
              className="grid gap-3 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-[0_8px_24px_rgba(62,45,24,0.05)] lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                  <span className="rounded-full bg-stone-100 px-2 py-1">{doc.sourceType.toUpperCase()}</span>
                  {doc.issuer ? <span className="rounded-full bg-stone-100 px-2 py-1">{doc.issuer}</span> : null}
                  <span>{formatDate(doc.uploadedAt)}</span>
                  {justSaved?.slug === doc.slug ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                      保存しました
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/docs/${encodeURIComponent(doc.slug)}`}
                  target="_blank"
                  className="block truncate text-base font-semibold text-stone-900 hover:text-amber-900 md:text-lg"
                  title={doc.title}
                >
                  {doc.title}
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((entry) => {
                  const isActive = entry === doc.category;
                  return (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => classify(doc.slug, entry)}
                      disabled={savingSlug === doc.slug}
                      className={[
                        "rounded-full border px-3 py-2 text-sm font-medium transition",
                        getCategoryButtonClass(entry, isActive),
                        savingSlug === doc.slug ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      {DOCUMENT_CATEGORY_LABELS[entry]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getCategoryButtonClass(category: DocumentCategory, isActive: boolean) {
  switch (category) {
    case "care":
      return isActive
        ? "border-sky-400 bg-sky-100 text-sky-950"
        : "border-sky-200 bg-white text-stone-600 hover:border-sky-300 hover:bg-sky-50";
    case "disability":
      return isActive
        ? "border-orange-400 bg-orange-100 text-orange-950"
        : "border-orange-200 bg-white text-stone-600 hover:border-orange-300 hover:bg-orange-50";
    case "common":
      return isActive
        ? "border-amber-400 bg-amber-100 text-amber-950"
        : "border-amber-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50";
    case "unclassified":
    default:
      return isActive
        ? "border-rose-400 bg-rose-100 text-rose-950"
        : "border-rose-200 bg-white text-stone-600 hover:border-rose-300 hover:bg-rose-50";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(value),
  );
}
