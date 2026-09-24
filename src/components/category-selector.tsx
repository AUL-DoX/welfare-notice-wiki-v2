import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/lib/document-categories";

const CATEGORY_ORDER: DocumentCategory[] = ["unclassified", "care", "disability", "common"];

type Props = {
  category: DocumentCategory;
  compact?: boolean;
};

/**
 * サービス種別の表示専用バッジ。設定はスプレッドシート（データベース）で
 * 行う運用のため、ここでは編集機能を持たない（以前は管理者ログイン時に
 * ここから直接カテゴリ変更できたが、/admin ごと廃止した）。
 */
export function CategorySelector({ category, compact = false }: Props) {
  return (
    <div className="space-y-2">
      <p className={compact ? "text-xs font-medium text-stone-500" : "text-sm font-medium text-stone-500"}>
        サービス種別
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((entry) => {
          const isActive = entry === category;

          return (
            <span
              key={entry}
              className={[
                "cursor-default rounded-full border px-3 py-2 font-medium",
                compact ? "text-xs" : "text-sm md:text-base",
                getCategoryButtonClass(entry, isActive),
              ].join(" ")}
            >
              {DOCUMENT_CATEGORY_LABELS[entry]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function getCategoryButtonClass(category: DocumentCategory, isActive: boolean) {
  switch (category) {
    case "care":
      return isActive ? "border-sky-300 bg-sky-100 text-sky-950" : "border-sky-200 bg-white text-stone-400";
    case "disability":
      return isActive
        ? "border-orange-300 bg-orange-100 text-orange-950"
        : "border-orange-200 bg-white text-stone-400";
    case "common":
      return isActive ? "border-amber-300 bg-amber-100 text-amber-950" : "border-amber-200 bg-white text-stone-400";
    case "unclassified":
    default:
      return isActive ? "border-rose-300 bg-rose-100 text-rose-950" : "border-rose-200 bg-white text-stone-400";
  }
}
