import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 介護と障害福祉サービスの通知文Wiki",
  description: "介護と障害福祉サービスの通知文Wikiにおける広告・アクセス解析・免責事項についてのプライバシーポリシーです。",
};

const OPERATOR_URL = "https://aul-dox.jp/%E9%81%8B%E5%96%B6%E8%80%85/";
const CONTACT_URL = "https://aul-dox.jp/%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B/";

const linkClass =
  "font-semibold text-amber-900 underline decoration-stone-300 underline-offset-4 hover:decoration-amber-900";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-8 text-stone-900 lg:px-8">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-stone-200/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(55,43,24,0.08)] md:p-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-900/70">Privacy Policy</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">プライバシーポリシー</h1>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. 当サイトが利用している広告サービス</h2>
          <p className="leading-8 text-stone-700">
            当サイト（https://wn-wiki.aul-dox.jp）では、第三者配信の広告サービス「Googleアドセンス」を利用しています。Googleなどの第三者広告配信事業者は、Cookie（クッキー）を使用して、ユーザーが当サイトや他のウェブサイトに過去にアクセスした際の情報に基づき、適切な広告をユーザーに表示します。
          </p>
          <p className="leading-8 text-stone-700">
            ユーザーは、Googleのアカウント設定で広告設定にアクセスすることで、パーソナライズ広告を無効にできます。また、www.aboutads.infoにアクセスすることで、第三者配信事業者がパーソナライズ広告の掲載に使用するCookieを無効にできるほか、お使いのブラウザの設定でCookieを無効にすることも可能です。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. 当サイトが利用しているアクセス解析ツール</h2>
          <p className="leading-8 text-stone-700">
            当サイトでは、アクセス状況（ページビュー数など）を把握するために、Vercel社のアクセス解析サービス「Vercel Web
            Analytics」を利用しています。このサービスはCookieを使用せず、個人を特定しない形でデータを集計します。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. 免責事項</h2>
          <p className="leading-8 text-stone-700">
            当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について一切の責任を負いません。また、当サイトのコンテンツ・情報について、できる限り正確な情報を提供するよう努めていますが、正確性や安全性を保証するものではありません。情報が古くなっている場合もあります。当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
          </p>
          <p className="leading-8 text-stone-700">
            当サイトに掲載している通知文・資料は、厚生労働省・自治体などが公開している情報を収集・整理したものです。正式な内容や最新の情報は、必ず各資料の原本（元ファイル・公表元）でご確認ください。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. プライバシーポリシーの変更について</h2>
          <p className="leading-8 text-stone-700">
            当サイトは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直し、その改善に努めます。修正された最新のプライバシーポリシーは常に本ページにて開示されます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. 運営者・お問い合わせ</h2>
          <p className="leading-8 text-stone-700">
            当サイトの運営者情報は
            <a href={OPERATOR_URL} className={linkClass} target="_blank" rel="noreferrer">
              運営者情報
            </a>
            をご覧ください。本ポリシーに関するお問い合わせは、
            <a href={CONTACT_URL} className={linkClass} target="_blank" rel="noreferrer">
              お問い合わせフォーム
            </a>
            よりご連絡ください。
          </p>
        </section>
      </article>
    </main>
  );
}
