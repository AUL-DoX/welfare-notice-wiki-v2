import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { KokuhorenSearch, type SearchItem } from "@/components/kokuhoren-search";
import {
  BASE_URL,
  HUB_PATH,
  LAST_VERIFIED,
  SERVICE_FULL_LABEL,
  getErrors,
  servicePath,
  type ErrorService,
} from "@/lib/kokuhoren-errors";

const TITLE = "介護・障がい福祉の国保連請求エラー検索｜返戻・仮審査の原因と確認方法";
const DESCRIPTION =
  "介護・障がい福祉の国保連請求で返戻や仮審査エラーが出たとき、エラーコードから原因・確認箇所・対応方法・一次情報までたどれる実務リファレンス。国保連・自治体等の公開情報を検索しやすく整理しています。";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  if (q) return { title: TITLE, robots: { index: false, follow: true } };
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: HUB_PATH },
    openGraph: { title: TITLE, description: DESCRIPTION },
  };
}

const FAQ = [
  {
    q: "国保連請求でエラーが出たら何を確認すればいい？",
    a: "まず、どのサービスの請求か（介護給付費等／障害福祉サービス費等）、エラーコードとメッセージ、どの段階で出たか（10日までの仮審査か、本審査後の返戻か）の3点を確認します。そのうえで、エラーコードを検索して原因と対応方法を調べてください。",
  },
  {
    q: "返戻と仮審査エラーは何が違う？",
    a: "仮審査エラーは請求受付期間中（毎月1日〜10日）に請求データの不備を事前に知らせるもので、10日までに修正して再送信すれば当月分として処理されます。返戻は本審査の後に請求が差し戻されるもので、当月は支払われず、翌月以降に修正して再請求します。",
  },
  {
    q: "エラーコードはどこを見ればいい？",
    a: "国保連から届く返戻（保留）一覧表などに、エラーコードとメッセージが表示されます。そのコードをこのページの検索欄に入力してください。",
  },
  {
    q: "仮審査エラーを放置するとどうなる？",
    a: "10日の締切までに修正・再送信しないと、該当の請求は本審査で返戻となる場合があり、その場合は当月の給付費は支払われません。締切前に対応することが重要です。",
  },
  {
    q: "エラーコードが分からない場合は？",
    a: "エラーメッセージの一部（例：「台帳」「受給者証」など）でも検索できます。それでも分からない場合は、国保連や保険者（自治体）にご確認ください。",
  },
];

const linkClass = "font-medium underline underline-offset-4 hover:text-amber-900";

export default async function KokuhorenErrorHubPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const items: SearchItem[] = (["kaigo", "shogai"] as ErrorService[]).flatMap((s) =>
    getErrors(s).map((e) => ({ s, k: e.key, c: e.code, t: e.title })),
  );
  const counts = { kaigo: getErrors("kaigo").length, shogai: getErrors("shogai").length };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-8 text-stone-900 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${BASE_URL}${HUB_PATH}`,
          url: `${BASE_URL}${HUB_PATH}`,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "ja",
          isPartOf: { "@type": "WebSite", name: "介護と障害福祉サービスの通知文Wiki", url: BASE_URL },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <Breadcrumbs
          items={[
            { name: "ホーム", href: "/" },
            { name: "国保連請求エラー検索", href: HUB_PATH },
          ]}
        />

        <header className="space-y-3">
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">介護・障がい福祉の国保連請求エラー検索</h1>
          <p className="leading-8 text-stone-700">
            介護・障がい福祉の国保連請求で返戻や仮審査エラーが出た場合、エラーコードから原因、確認箇所、対応方法、一次情報を確認できます。wn-wikiでは、国保連や自治体等が公開している情報をもとに、現場で検索しやすい形に整理しています。
          </p>
        </header>

        <section
          aria-label="エラーコード検索"
          className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm"
        >
          <KokuhorenSearch items={items} initialQuery={q ?? ""} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold md:text-2xl">サービスから探す</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["kaigo", "shogai"] as ErrorService[]).map((s) => (
              <Link
                key={s}
                href={servicePath(s)}
                className="rounded-[1.35rem] border border-stone-200 bg-white p-4 transition hover:border-amber-900"
              >
                <h3 className="text-lg font-semibold">{SERVICE_FULL_LABEL[s]}</h3>
                <p className="mt-1 text-sm leading-7 text-stone-700">エラーコード{counts[s]}件を一覧から探せます。</p>
              </Link>
            ))}
          </div>
          <p className="text-sm leading-7 text-stone-700">
            返戻と仮審査エラーの違いや調べ方は、
            <Link href="/henrei-guide" className={linkClass}>
              返戻・仮審査エラー、どうすればいい？
            </Link>
            にまとめています。マニュアル全体を一度に見たいときは、
            <Link href="/henrei-search" className={linkClass}>
              介護の返戻対応マニュアル検索
            </Link>
            と
            <Link href="/shogai-error-search" className={linkClass}>
              障がい福祉エラーコード検索
            </Link>
            もご利用ください。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold md:text-2xl">よくある質問</h2>
          <dl className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-stone-900">{f.q}</dt>
                <dd className="mt-1 leading-8 text-stone-700">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-2 border-t border-stone-200 pt-6">
          <h2 className="text-lg font-semibold">情報源について</h2>
          <p className="text-sm leading-7 text-stone-600">
            掲載しているエラーコードは、北海道国民健康保険団体連合会（介護給付費等の返戻対応マニュアル・エラーコード一覧、障害者総合支援請求情報エラーメッセージ一覧）と、厚生労働省が公表している新規・移行エラーコード一覧をもとにしています。最終確認：{LAST_VERIFIED}。詳しくは
            <Link href="/about" className="underline underline-offset-4 hover:text-amber-900">
              このサイトについて
            </Link>
            をご覧ください。
          </p>
          <p className="text-sm leading-7 text-stone-600">
            本ページは国保連・自治体等の公開情報を検索しやすく整理したものです。実際の請求処理や制度判断については、必ず国保連・自治体等の一次情報をご確認ください。
          </p>
        </section>
      </div>
    </main>
  );
}
