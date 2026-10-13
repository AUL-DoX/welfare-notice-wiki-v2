import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { BASE_URL, HUB_PATH } from "@/lib/kokuhoren-errors";

const OPERATOR_URL = "https://aul-dox.jp/%E9%81%8B%E5%96%B6%E8%80%85/";
const CONTACT_URL = "https://aul-dox.jp/%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B/";

const TITLE = "このサイトについて｜介護と障害福祉サービスの通知文Wiki（wn-wiki）";
const DESCRIPTION =
  "wn-wikiは、国保連・自治体・厚生労働省などの公的情報を、介護・障がい福祉の現場で検索しやすく再構成した実務リファレンスです。対象分野、情報源、更新方法、運営者、一次情報との関係を説明します。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const h2Class = "text-xl font-semibold md:text-2xl";
const pClass = "leading-8 text-stone-700";
const linkClass = "font-medium underline underline-offset-4 hover:text-amber-900";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-8 text-stone-900 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${BASE_URL}/about`,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "ja",
          about: {
            "@type": "WebSite",
            name: "介護と障害福祉サービスの通知文Wiki",
            alternateName: "wn-wiki",
            url: BASE_URL,
            publisher: { "@type": "Organization", name: "AUL DoX", url: "https://aul-dox.jp" },
          },
        }}
      />
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-[2rem] border border-stone-200/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(55,43,24,0.08)] md:p-8">
        <Breadcrumbs
          items={[
            { name: "ホーム", href: "/" },
            { name: "このサイトについて", href: "/about" },
          ]}
        />

        <header className="space-y-3">
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">このサイトについて</h1>
          <p className={pClass}>
            介護と障害福祉サービスの通知文Wiki（wn-wiki）は、国保連・自治体・厚生労働省などが公開している公的情報を、介護・障がい福祉の現場で検索しやすい形に再構成した実務リファレンスです。
          </p>
        </header>

        <section className="space-y-3">
          <h2 className={h2Class}>wn-wikiとは</h2>
          <p className={pClass}>
            通知文・様式・事務連絡などの全文検索と、国保連請求のエラーコード検索を提供しています。困りごとからエラーコードを調べ、原因と確認事項、対応方法を整理し、最後に一次情報で確認する、という流れを支えることが役割です。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>対象分野</h2>
          <ul className="list-disc space-y-1 pl-6 leading-8 text-stone-700">
            <li>介護保険サービス（介護給付費等の請求を含む）</li>
            <li>障害福祉サービス（障害福祉サービス費等の請求を含む）</li>
            <li>
              国保連請求のエラーコード（
              <Link href={HUB_PATH} className={linkClass}>
                国保連請求エラー検索
              </Link>
              ）
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>情報源と情報収集の方法</h2>
          <p className={pClass}>
            情報源は、北海道国民健康保険団体連合会、厚生労働省、札幌市などの自治体、福祉医療機構が公開している資料です。公開されている通知文・様式・マニュアルを取り込み、本文を抽出して検索できるようにしています。収録した資料には、分野などの分類とキーワードを付けています。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>一次情報との関係</h2>
          <p className={pClass}>
            wn-wikiは一次情報そのものではありません。国保連や自治体、厚生労働省の公表資料を検索しやすく整理したもので、それらに代わるものではありません。実際の請求処理や制度判断については、必ず国保連・自治体等の一次情報をご確認ください。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>更新について</h2>
          <p className={pClass}>
            新しい通知や様式は定期的に確認して追加しています。エラーコードのページには、情報源と最終確認日を表示しています。制度改定や公表資料の更新によって内容が変わることがありますので、最新の情報は一次情報でご確認ください。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>運営者</h2>
          <p className={pClass}>
            運営：AUL DoX。詳細は
            <a href={OPERATOR_URL} className={linkClass} target="_blank" rel="noreferrer">
              運営者情報
            </a>
            をご覧ください。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>誤りを見つけた場合</h2>
          <p className={pClass}>
            掲載内容に誤りや古い情報を見つけた場合は、
            <a href={CONTACT_URL} className={linkClass} target="_blank" rel="noreferrer">
              お問い合わせ
            </a>
            からご連絡ください。内容を一次情報と照らして確認し、必要に応じて訂正します。
          </p>
        </section>
      </article>
    </main>
  );
}
