"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const router = useRouter();
  const [docs, setDocs] = useState<AdminDocument[]>(documents);
  const [pending, setPending] = useState<Record<string, DocumentCategory>>({});
  const [filter, setFilter] = useState<FilterKey>("unclassified");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pendingCount = Object.keys(pending).length;

  useEffect(() => {
    if (pendingCount === 0) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pendingCount]);

  function effectiveCategory(doc: AdminDocument): DocumentCategory {
    return pending[doc.slug] ?? doc.category;
  }

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = { all: docs.length, unclassified: 0, care: 0, disability: 0, common: 0 };
    for (const doc of docs) {
      base[effectiveCategory(doc)] += 1;
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, pending]);

  const visibleDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const matchesFilter = filter === "all" || effectiveCategory(doc) === filter;
      if (!matchesFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return `${doc.title} ${doc.issuer ?? ""}`.toLowerCase().includes(normalizedQuery);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, pending, filter, query]);

  function selectCategory(slug: string, nextCategory: DocumentCategory) {
    const doc = docs.find((entry) => entry.slug === slug);
    if (!doc) {
      return;
    }

    setPending((current) => {
      const next = { ...current };
      if (nextCategory === doc.category) {
        delete next[slug];
      } else {
        next[slug] = nextCategory;
      }
      return next;
    });
  }

  async function saveChanges() {
    if (pendingCount === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const changes = Object.entries(pending).map(([slug, category]) => ({ slug, category }));

    try {
      const response = await fetch("/api/categories/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "保存に失敗しました。");
      }

      setDocs((current) =>
        current.map((doc) => (pending[doc.slug] ? { ...doc, category: pending[doc.slug] } : doc)),
      );
      setPending({});
      setMessage(`${changes.length}件を保存しました。本番サイトへ反映されます（デプロイに1〜2分）。`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setPending({});
    setError(null);
    setMessage(null);
  }

  return (
    <div className="space-y-4 pb-20">
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
      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </p>
      ) : null}

      <p className="text-sm text-stone-600">
        {filter === "unclassified"
          ? `未分類 ${counts.unclassified} 件。カテゴリを押すと選択されます（この時点ではまだ保存されません）。下の「変更を保存」で確定してください。`
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
          visibleDocs.map((doc) => {
            const current = effectiveCategory(doc);
            const isPending = Boolean(pending[doc.slug]);

            return (
              <div
                key={doc.slug}
                className={[
                  "grid gap-3 rounded-[1.5rem] border bg-white p-4 shadow-[0_8px_24px_rgba(62,45,24,0.05)] lg:grid-cols-[1fr_auto] lg:items-center",
                  isPending ? "border-amber-400" : "border-stone-200",
                ].join(" ")}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                    <span className="rounded-full bg-stone-100 px-2 py-1">{doc.sourceType.toUpperCase()}</span>
                    {doc.issuer ? <span className="rounded-full bg-stone-100 px-2 py-1">{doc.issuer}</span> : null}
                    <span>{formatDate(doc.uploadedAt)}</span>
                    {isPending ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                        未保存の変更
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
                    const isActive = entry === current;
                    return (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => selectCategory(doc.slug, entry)}
                        className={[
                          "rounded-full border px-3 py-2 text-sm font-medium transition",
                          getCategoryButtonClass(entry, isActive),
                        ].join(" ")}
                      >
                        {DOCUMENT_CATEGORY_LABELS[entry]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgba(55,43,24,0.12)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-800 md:text-base">
              未保存の変更が {pendingCount} 件あります。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={discardChanges}
                disabled={saving}
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 disabled:opacity-60"
              >
                取り消す
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-wait disabled:bg-stone-400"
              >
                {saving ? "保存中..." : `変更を保存（${pendingCount}件）`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
