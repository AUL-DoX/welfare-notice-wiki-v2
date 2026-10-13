import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import {
  BASE_URL,
  HUB_PATH,
  LAST_VERIFIED,
  SERVICE_FULL_LABEL,
  SERVICE_LABEL,
  errorDescription,
  errorPath,
  errorTitle,
  getError,
  getErrors,
  getRelatedErrors,
  isErrorService,
  servicePath,
  type ErrorService,
} from "@/lib/kokuhoren-errors";

type Props = { params: Promise<{ service: string; code: string }> };

export function generateStaticParams() {
  return (["kaigo", "shogai"] as ErrorService[]).flatMap((service) =>
    getErrors(service).map((e) => ({ service, code: e.key })),
  );
}

function resolve(service: string, rawCode: string) {
  if (!isErrorService(service)) return null;
  const key = decodeURIComponent(rawCode);
  const entry = getError(service, key);
  if (entry) return { entry, redirectKey: null };
  // 小文字・全角で来た場合は正規のURLへ寄せる
  const normalized = key.normalize("NFKC").toUpperCase();
  const alt = normalized !== key ? getError(service, normalized) : undefined;
  return alt ? { entry: alt, redirectKey: alt.key } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, code } = await params;
  const r = resolve(service, code);
  if (!r) return {};
  const { entry } = r;
  const title = errorTitle(entry);
  const description = errorDescription(entry);
  return {
    title: { absolute: `${title}｜wn-wiki` },
    description,
    // 原因・対応方法まで解説していない一覧のみのページは、検索結果に出さずリンクだけたどらせる
    // （noindexとcanonicalは併用しない）
    ...(entry.detailed
      ? { alternates: { canonical: errorPath(entry) } }
      : { robots: { index: false, follow: true } }),
    openGraph: { title, description },
  };
}

const h2Class = "text-xl font-semibold md:text-2xl";
const bodyClass = "whitespace-pre-wrap leading-8 text-stone-700";

export default async function KokuhorenErrorPage({ params }: Props) {
  const { service, code } = await params;
  const r = resolve(service, code);
  if (!r) notFound();
  if (r.redirectKey) permanentRedirect(errorPath(r.entry));
  const { entry } = r;
  const related = getRelatedErrors(entry);
  const svc = entry.service;

  const crumbs = [
    { name: "ホーム", href: "/" },
    { name: "国保連請求エラー検索", href: HUB_PATH },
    { name: SERVICE_LABEL[svc], href: servicePath(svc) },
    { name: entry.code, href: errorPath(entry) },
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-8 text-stone-900 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: `${BASE_URL}${errorPath(entry)}`,
          name: errorTitle(entry),
          description: errorDescription(entry),
          inLanguage: "ja",
          isPartOf: { "@type": "WebPage", url: `${BASE_URL}${HUB_PATH}` },
        }}
      />
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-[2rem] border border-stone-200/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(55,43,24,0.08)] md:p-8">
        <Breadcrumbs items={crumbs} />

        <header className="space-y-3">
          <p className="text-sm font-semibold tracking-[0.12em] text-orange-800/80">
            国保連請求エラー｜{SERVICE_LABEL[svc]}
          </p>
          <h1 className="font-mono text-4xl font-bold tracking-tight md:text-5xl">{entry.code}</h1>
        </header>

        <section className="space-y-3">
          <h2 className={h2Class}>このエラーは何か</h2>
          <p className="leading-8 text-stone-700">
            {SERVICE_FULL_LABEL[svc]}の国保連請求で、エラーコード{entry.code}は「{entry.title}」と表示されるエラーです。
          </p>
        </section>

        {entry.cause ? (
          <section className="space-y-3">
            <h2 className={h2Class}>主な原因</h2>
            <p className={bodyClass}>{entry.cause}</p>
          </section>
        ) : null}

        {entry.remedy ? (
          <section className="space-y-3">
            <h2 className={h2Class}>まず確認すること・対応方法</h2>
            <p className={bodyClass}>{entry.remedy}</p>
          </section>
        ) : null}

        {entry.extraBlocks.map((b) => (
          <section key={b.label} className="space-y-3">
            <h2 className={h2Class}>{b.label}</h2>
            <p className={bodyClass}>{b.text}</p>
          </section>
        ))}

        {!entry.detailed ? (
          <section className="rounded-xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
            このコードは一覧にメッセージのみ収録されており、原因・対応方法の詳しい解説は、出典側の資料に記載がある場合に追記します。詳細は下記の一次情報をご確認ください。
          </section>
        ) : null}

        <section className="space-y-2 border-t border-stone-200 pt-6">
          <h2 className={h2Class}>一次情報</h2>
          <dl className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-2 text-sm leading-7 text-stone-700">
            <dt className="font-semibold text-stone-900">情報源</dt>
            <dd>{entry.sourceName}</dd>
            <dt className="font-semibold text-stone-900">資料名</dt>
            <dd>{entry.sourceKind}</dd>
            <dt className="font-semibold text-stone-900">最終確認</dt>
            <dd>{LAST_VERIFIED}</dd>
          </dl>
          <p className="text-sm leading-7 text-stone-600">
            本ページは国保連・自治体等の公開情報を検索しやすく整理したものです。実際の請求処理や制度判断については、必ず国保連・自治体等の一次情報をご確認ください。
          </p>
        </section>

        {related.length > 0 ? (
          <section className="space-y-3">
            <h2 className={h2Class}>関連エラー</h2>
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {related.map((o) => (
                <li key={o.key}>
                  <Link href={errorPath(o)} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5 hover:bg-amber-50">
                    <span className="w-20 shrink-0 font-mono font-bold">{o.code}</span>
                    <span className="min-w-0 flex-1 text-sm text-stone-700">{o.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <nav className="flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-200 pt-6 text-sm font-medium">
          <Link href={HUB_PATH} className="underline underline-offset-4 hover:text-amber-900">
            国保連請求エラー検索に戻る
          </Link>
          <Link href={servicePath(svc)} className="underline underline-offset-4 hover:text-amber-900">
            {SERVICE_LABEL[svc]}のエラーコード一覧
          </Link>
          <Link href="/henrei-guide" className="underline underline-offset-4 hover:text-amber-900">
            返戻・仮審査エラー、どうすればいい？
          </Link>
        </nav>
      </article>
    </main>
  );
}
