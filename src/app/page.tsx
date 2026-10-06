import Link from "next/link";
import { getDocumentIndex } from "@/lib/documents";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/lib/document-categories";
import { SourceFileLink } from "@/components/source-file-link";
import { searchOtherTools } from "@/lib/cross-search";

export const dynamic = "force-dynamic";

const CATEGORY_TAB_ORDER: DocumentCategory[] = ["care", "disability", "common", "unclassified"];
type CategoryTab = DocumentCategory | "all";

const CATEGORY_CHIP_CLASS: Record<DocumentCategory, string> = {
  care: "border-sky-200 bg-sky-50 text-sky-900",
  disability: "border-orange-200 bg-orange-50 text-orange-900",
  common: "border-amber-200 bg-amber-50 text-amber-900",
  unclassified: "border-rose-200 bg-rose-50 text-rose-900",
};

// 本文を抽出できなかった文書の定型文は、要約として表示しない
// Markdown資料の要約に含まれる見出し記号（# など）を取り除く
function cleanSummary(summary: string): string {
  return summary.replace(/^#+\s*/, "").trim();
}

function hasUsableSummary(summary: string): boolean {
  return summary.trim() !== "" && summary !== "本文を抽出できませんでした。";
}

function isDocumentCategory(value: string): value is DocumentCategory {
  return value in DOCUMENT_CATEGORY_LABELS;
}

function buildTabHref(query: string, category: CategoryTab): string {
  const searchParams = new URLSearchParams();
  if (query) searchParams.set("q", query);
  if (category !== "all") searchParams.set("category", category);
  const qs = searchParams.toString();
  return qs ? `/?${qs}` : "/";
}

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const categoryParam = params.category ?? "";
  const categoryFilter: CategoryTab = isDocumentCategory(categoryParam) ? categoryParam : "all";

  const { documents: matchedDocuments, sourceCount, failedDocuments } = await getDocumentIndex(query);
  const crossSearch = query ? searchOtherTools(query) : null;

  const categoryCounts = matchedDocuments.reduce<Record<CategoryTab, number>>(
    (counts, doc) => {
      counts[doc.category] += 1;
      counts.all += 1;
      return counts;
    },
    { all: 0, care: 0, disability: 0, common: 0, unclassified: 0 },
  );

  const documents =
    categoryFilter === "all" ? matchedDocuments : matchedDocuments.filter((doc) => doc.category === categoryFilter);
  const latestDocuments = documents.slice(0, 5);
  const heading =
    categoryFilter === "all"
      ? query
        ? `「${query}」の検索結果`
        : "新着記事"
      : query
        ? `「${query}」の検索結果（${DOCUMENT_CATEGORY_LABELS[categoryFilter]}）`
        : `${DOCUMENT_CATEGORY_LABELS[categoryFilter]}の一覧`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] text-stone-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 lg:px-8 lg:py-6">
        <section className="grid gap-4 rounded-[2rem] border border-stone-200/70 bg-white/90 p-5 shadow-[0_24px_70px_rgba(55,43,24,0.08)] backdrop-blur">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-900/70">
              AUL Welfare Notice Wiki
            </p>
            <h1 className="max-w-5xl text-[1.8rem] font-semibold leading-[1.08] tracking-[-0.03em] text-stone-900 md:text-[2.45rem]">
              介護と障害福祉サービスの通知文Wiki
            </h1>
            <p className="max-w-4xl text-lg leading-9 text-stone-700 md:text-xl">
              キーワードを入力すると、介護と障害福祉サービスに関する通知文を検索できます。詳細ページでは、
              運用時に追加した関連キーワードを確認できます。
            </p>
            <form className="flex flex-col gap-3 sm:flex-row" action="/">
              {categoryFilter !== "all" ? <input type="hidden" name="category" value={categoryFilter} /> : null}
              <input
                key={query}
                type="search"
                name="q"
                defaultValue={query}
                placeholder="例: 処遇改善加算 交付要綱 補助金"
                className="min-w-0 flex-1 rounded-full border-2 border-stone-400 bg-stone-50 px-5 py-3 text-lg outline-none placeholder:text-stone-400 transition focus:border-amber-800 focus:bg-white md:text-xl"
              />
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-6 py-3 text-base font-semibold text-stone-50 transition hover:bg-amber-900 md:text-lg"
              >
                検索する
              </button>
              {query ? (
                <Link
                  href={buildTabHref("", categoryFilter)}
                  className="rounded-full border border-stone-300 px-6 py-3 text-center text-base font-semibold text-stone-700 transition hover:border-amber-900 hover:text-amber-900 md:text-lg"
                >
                  検索クリア
                </Link>
              ) : null}
            </form>
            <p className="text-sm text-stone-500">現在 {sourceCount} 件収録</p>
          </div>
        </section>

        {crossSearch && (crossSearch.henrei.total > 0 || crossSearch.shogai.total > 0) ? (
          <section className="grid gap-3 sm:grid-cols-2">
            {crossSearch.henrei.total > 0 ? (
              <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-orange-950">
                    返戻対応マニュアル検索にも一致（{crossSearch.henrei.total}件）
                  </h2>
                  <Link
                    href={`/henrei-search?q=${encodeURIComponent(query)}`}
                    className="text-sm font-semibold text-orange-900 underline decoration-orange-300 underline-offset-4 hover:decoration-orange-900"
                  >
                    すべて見る →
                  </Link>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {crossSearch.henrei.items.map((match) => (
                    <li key={match.key} className="text-sm leading-6 text-stone-700">
                      <span className="mr-2 rounded bg-orange-200/70 px-1.5 py-0.5 font-mono text-xs font-semibold text-orange-950">
                        {match.entry.code ?? "—"}
                      </span>
                      {match.entry.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {crossSearch.shogai.total > 0 ? (
              <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-sky-950">
                    障がい福祉エラーコード検索にも一致（{crossSearch.shogai.total}件）
                  </h2>
                  <Link
                    href={`/shogai-error-search?q=${encodeURIComponent(query)}`}
                    className="text-sm font-semibold text-sky-900 underline decoration-sky-300 underline-offset-4 hover:decoration-sky-900"
                  >
                    すべて見る →
                  </Link>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {crossSearch.shogai.items.map((match) => (
                    <li key={match.key} className="text-sm leading-6 text-stone-700">
                      <span className="mr-2 rounded bg-sky-200/70 px-1.5 py-0.5 font-mono text-xs font-semibold text-sky-950">
                        {match.entry.code}
                      </span>
                      {match.entry.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {failedDocuments.length > 0 ? (
          <section className="rounded-[1.5rem] border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <h2 className="text-lg font-semibold">読み込みエラー</h2>
            <div className="mt-3 flex flex-col gap-2">
              {failedDocuments.map((item) => (
                <p key={item.fileName} className="rounded-2xl bg-white px-4 py-3 text-sm leading-6">
                  {item.fileName}: {item.error}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3">
          {categoryFilter !== "all" || query ? (
            <Link
              href="/"
              className="w-fit text-sm font-semibold text-amber-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-900"
            >
              ← Wikiトップへ戻る
            </Link>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {(["all", ...CATEGORY_TAB_ORDER] as CategoryTab[]).map((tab) => {
              const isActive = tab === categoryFilter;
              const label = tab === "all" ? "すべて" : DOCUMENT_CATEGORY_LABELS[tab];
              return (
                <Link
                  key={tab}
                  href={buildTabHref(query, tab)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition md:text-base",
                    isActive
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {label}
                  <span className={isActive ? "ml-2 text-stone-300" : "ml-2 text-stone-400"}>
                    {categoryCounts[tab]}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">Documents</p>
              <h2 className="mt-1 text-2xl font-semibold">{heading}</h2>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-stone-600">{documents.length}件</p>
              {query ? (
                <Link
                  href={buildTabHref("", categoryFilter)}
                  className="text-sm font-semibold text-amber-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-900"
                >
                  検索クリア
                </Link>
              ) : null}
            </div>
          </div>

          {latestDocuments.length > 0 ? (
            <section className="grid gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_12px_35px_rgba(62,45,24,0.06)] lg:grid-cols-[0.85fr_1.5fr_0.8fr]">
              {/* 左: 日付順一覧。高さは中央カラム（最新5件）に合わせ、はみ出す分は内部スクロール */}
              <aside className="relative rounded-[1.35rem] bg-stone-50">
                <div className="flex max-h-[28rem] flex-col p-4 lg:absolute lg:inset-0 lg:max-h-none">
                  <h3 className="shrink-0 text-lg font-semibold text-stone-900 md:text-xl">日付順一覧</h3>
                  <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                    {documents.map((doc) => (
                      <li key={doc.slug}>
                        <Link
                          href={`/docs/${encodeURIComponent(doc.slug)}`}
                          className="block rounded-[1rem] bg-white px-3 py-2.5 transition hover:bg-amber-50"
                        >
                          <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                            <span>{formatDate(doc.uploadedAt)}</span>
                            <span className={`rounded-full border px-2 py-0.5 ${CATEGORY_CHIP_CLASS[doc.category]}`}>
                              {DOCUMENT_CATEGORY_LABELS[doc.category]}
                            </span>
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-stone-900">{doc.title}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              {/* 中央: 新着記事（最新5件） */}
              <div className="flex flex-col gap-3">
                {latestDocuments.map((doc) => (
                  <article key={doc.slug} className="rounded-[1.35rem] border border-stone-200/70 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                      <Badge>{doc.sourceType.toUpperCase()}</Badge>
                      {doc.issuer ? <Badge>{doc.issuer}</Badge> : null}
                      <span className={`rounded-full border px-3 py-1 ${CATEGORY_CHIP_CLASS[doc.category]}`}>
                        {DOCUMENT_CATEGORY_LABELS[doc.category]}
                      </span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                    <Link
                      href={`/docs/${encodeURIComponent(doc.slug)}`}
                      className="mt-2 block text-lg font-semibold leading-7 tracking-tight text-stone-900 hover:text-amber-900 md:text-xl"
                    >
                      {doc.title}
                    </Link>
                    {hasUsableSummary(doc.summary) ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-7 text-stone-600">{cleanSummary(doc.summary)}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-4">
                      <Link
                        href={`/docs/${encodeURIComponent(doc.slug)}`}
                        className="text-sm font-semibold text-amber-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-900"
                      >
                        全文を見る
                      </Link>
                      <SourceFileLink
                        slug={doc.slug}
                        className="text-sm font-semibold text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-amber-900 hover:decoration-amber-900"
                      >
                        元ファイルを開く
                      </SourceFileLink>
                    </div>
                  </article>
                ))}
              </div>

              {/* 右: 請求でお困りの方へ（ツール案内）＋このWikiについて */}
              <aside className="flex flex-col gap-3">
                <div className="rounded-[1.35rem] border border-orange-200 bg-orange-50 p-4">
                  <h3 className="text-lg font-semibold leading-7 text-orange-950">
                    返戻・仮審査エラー、どうすればいい？
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    国保連への請求でエラーや返戻が届いたときの、違い・確認すること・調べ方をまとめました。
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href="/henrei-guide"
                      className="rounded-full bg-orange-500 px-4 py-2.5 text-center text-sm font-bold text-black transition hover:bg-orange-600"
                    >
                      対応ガイドを見る →
                    </Link>
                    <Link
                      href="/henrei-search"
                      className="rounded-full border border-orange-300 bg-white px-4 py-2 text-center text-sm font-semibold text-orange-900 transition hover:bg-orange-100"
                    >
                      返戻対応マニュアル検索
                    </Link>
                    <Link
                      href="/shogai-error-search"
                      className="rounded-full border border-sky-300 bg-white px-4 py-2 text-center text-sm font-semibold text-sky-900 transition hover:bg-sky-50"
                    >
                      障がい福祉エラーコード検索
                    </Link>
                  </div>
                </div>

                <div className="rounded-[1.35rem] bg-stone-50 p-4">
                  <h3 className="text-lg font-semibold text-stone-900">このWikiについて</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    厚生労働省や自治体などが公開する通知文・資料を収集し、介護と障がい福祉の分野別に検索できるようにしたWikiです。毎週、新しい資料を取り込んでいます。
                  </p>
                  <Link
                    href="/updates"
                    className="mt-2 inline-block text-sm font-semibold text-amber-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-900"
                  >
                    更新情報を見る →
                  </Link>
                </div>
              </aside>
            </section>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-stone-600">
              {query
                ? "検索に一致する文書がありません。別の表現で試してください。"
                : categoryFilter !== "all"
                  ? `${DOCUMENT_CATEGORY_LABELS[categoryFilter]}に分類された文書がまだありません。`
                  : "文書が登録されると、ここに新着記事が表示されます。"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
      {children}
    </span>
  );
}

function formatDate(updatedAt: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(updatedAt));
}
