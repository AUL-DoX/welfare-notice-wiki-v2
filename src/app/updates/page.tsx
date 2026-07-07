import type { Metadata } from "next";
import Link from "next/link";
import { isAdminModeCookie } from "@/lib/admin";
import { getWatchLinks, isDownloadableUrl } from "@/lib/watch-links";
import { WatchLinkPromoteButton } from "@/components/watch-link-promote-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "更新情報｜介護と障害福祉サービスの通知文Wiki",
  description: "WAM NET・札幌市・厚生労働省の福祉サイト更新情報を自動収集した一覧です。",
};

export default async function UpdatesPage() {
  const [items, isAdmin] = await Promise.all([getWatchLinks(), isAdminModeCookie()]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] text-stone-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-5 lg:px-8 lg:py-6">
        <section className="rounded-[2rem] border border-stone-200/70 bg-white/90 p-5 shadow-[0_24px_70px_rgba(55,43,24,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-900/70">
            AUL Welfare Notice Wiki
          </p>
          <h1 className="mt-1 text-[1.8rem] font-semibold leading-[1.08] tracking-[-0.03em] text-stone-900 md:text-[2.2rem]">
            更新情報
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-stone-700 md:text-lg">
            WAM NET・札幌市・厚生労働省の福祉サイトを毎週自動で巡回して収集したリンク一覧です。
            {isAdmin ? "「保存する」を押すとPDF等のファイルをこのWikiに永続保存できます。" : null}
          </p>
          <Link href="/" className="mt-3 inline-block text-sm font-semibold text-amber-900 underline decoration-stone-300 underline-offset-4 hover:decoration-amber-900">
            ← Wikiトップへ戻る
          </Link>
        </section>

        <section className="flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-stone-600">
              まだ収集されたリンクがありません。
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-[1.35rem] border border-stone-200/70 bg-white p-4 shadow-[0_12px_35px_rgba(62,45,24,0.06)]"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                    <span className="rounded-full bg-stone-100 px-3 py-1">{item.source}</span>
                    <span>{formatDate(item.collectedAt)}</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-base font-semibold leading-6 text-stone-900 underline decoration-stone-300 underline-offset-4 hover:text-amber-900 hover:decoration-amber-900"
                  >
                    {item.title}
                  </a>
                </div>

                <div className="shrink-0">
                  {item.promotedSlug ? (
                    <Link
                      href={`/docs/${encodeURIComponent(item.promotedSlug)}`}
                      className="whitespace-nowrap rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900"
                    >
                      保存済み →
                    </Link>
                  ) : isAdmin && isDownloadableUrl(item.url) ? (
                    <WatchLinkPromoteButton id={item.id} />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoDate));
}
