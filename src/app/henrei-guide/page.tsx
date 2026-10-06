import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "返戻・仮審査エラー、どうすればいい？｜国保連請求の対応と調べ方",
  description:
    "国保連への請求で「仮審査エラー」や「返戻」が届いたときの、違い・確認すること・調べ方をまとめました。介護給付費等と障害福祉サービス費等のエラーコード検索へも進めます。",
};

const h2Class = "text-xl font-semibold md:text-2xl";
const pClass = "leading-8 text-stone-700";

export default function HenreiGuidePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-8 text-stone-900 lg:px-8">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-[2rem] border border-stone-200/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(55,43,24,0.08)] md:p-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-800/80">返戻対応ガイド</p>
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">返戻・仮審査エラー、どうすればいい？</h1>
          <p className={pClass}>
            国保連への請求後にエラーや返戻が届いたとき、何を確認し、どこで調べればよいかをまとめました。事業所の請求担当者向けで、介護給付費等と障害福祉サービス費等の両方に対応しています。
          </p>
        </header>

        <section className="space-y-3">
          <h2 className={h2Class}>まず結論：仮審査エラーと返戻の違い</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm md:text-base">
              <thead>
                <tr className="bg-stone-100 text-stone-800">
                  <th className="border border-stone-200 px-3 py-2 font-semibold">区分</th>
                  <th className="border border-stone-200 px-3 py-2 font-semibold">仮審査エラー</th>
                  <th className="border border-stone-200 px-3 py-2 font-semibold">返戻（へんれい）</th>
                </tr>
              </thead>
              <tbody className="text-stone-700">
                <tr>
                  <th className="border border-stone-200 bg-stone-50 px-3 py-2 font-semibold">発生時期</th>
                  <td className="border border-stone-200 px-3 py-2">請求受付期間中（毎月1日〜10日）</td>
                  <td className="border border-stone-200 px-3 py-2">本審査の完了後（月中旬以降）</td>
                </tr>
                <tr>
                  <th className="border border-stone-200 bg-stone-50 px-3 py-2 font-semibold">支払への影響</th>
                  <td className="border border-stone-200 px-3 py-2">10日までに修正すれば、当月の請求として処理</td>
                  <td className="border border-stone-200 px-3 py-2">当月は入金されない</td>
                </tr>
                <tr>
                  <th className="border border-stone-200 bg-stone-50 px-3 py-2 font-semibold">対応</th>
                  <td className="border border-stone-200 px-3 py-2">10日までにデータを修正して再送信</td>
                  <td className="border border-stone-200 px-3 py-2">翌月以降にエラーを修正して再請求</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>仮審査エラーとは</h2>
          <p className={pClass}>
            国保連への請求受付期間中（毎月1日〜10日）に、送信した請求データに形式的な不備や台帳との不一致がないかを、システムが事前に自動でチェックする処理です。締切の前に不備に気づき、修正できるようにするための仕組みです。
          </p>
          <p className={pClass}>
            10日の締切前であれば、データを修正して再送信すれば、当月分の請求としてそのまま処理されます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>返戻とは</h2>
          <p className={pClass}>
            本審査（10日の締切後に行われる国保連や自治体の審査）の結果、請求データに誤りや不備があり、請求が受け付けられずに事業所へ差し戻されることです。返戻になった分の給付費（報酬）は、当月は支払われません。
          </p>
          <p className={pClass}>主な原因には、次のようなものがあります。</p>
          <ul className="list-disc space-y-1 pl-6 leading-8 text-stone-700">
            <li>保険者番号・被保険者番号などの入力ミス</li>
            <li>自治体の台帳（受給者・被保険者の情報）と、請求内容の相違（多く見られる原因です）</li>
            <li>受給者証の期限切れ（障害福祉）</li>
            <li>ケアプランや支給限度額との不一致（介護）</li>
            <li>そのほか、請求データの誤りや不備</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>まず確認すること</h2>
          <ol className="list-decimal space-y-1 pl-6 leading-8 text-stone-700">
            <li>どのサービスの請求か（介護給付費等／障害福祉サービス費等）</li>
            <li>エラーコードとエラーメッセージ</li>
            <li>どの段階で出たか（10日までの仮審査か、本審査後の返戻か）</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>エラーの調べ方</h2>
          <p className={pClass}>エラーコードやメッセージが分かれば、次の検索ツールで原因と対処を調べられます。</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-orange-200 bg-orange-50 p-4">
              <h3 className="text-lg font-semibold text-orange-950">介護給付費等の場合</h3>
              <p className="mt-1 text-sm leading-7 text-stone-700">
                返戻対応マニュアル検索（549件）。コードやキーワードで探せます。
              </p>
              <Link
                href="/henrei-search"
                className="mt-3 block rounded-full bg-orange-500 px-4 py-2.5 text-center text-sm font-bold text-black transition hover:bg-orange-600"
              >
                返戻対応マニュアル検索 →
              </Link>
            </div>
            <div className="rounded-[1.35rem] border border-sky-200 bg-sky-50 p-4">
              <h3 className="text-lg font-semibold text-sky-950">障害福祉サービス費等の場合</h3>
              <p className="mt-1 text-sm leading-7 text-stone-700">
                障がい福祉エラーコード検索（755件）。原因と対処つきです。
              </p>
              <Link
                href="/shogai-error-search"
                className="mt-3 block rounded-full border border-sky-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-sky-900 transition hover:bg-sky-100"
              >
                障がい福祉エラーコード検索 →
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>返戻になったあとの対応</h2>
          <ol className="list-decimal space-y-1 pl-6 leading-8 text-stone-700">
            <li>国保連から届く「返戻（保留）一覧表」で、エラーの内容を確認する</li>
            <li>上の検索ツールで、原因と対処を調べて修正する</li>
            <li>翌月以降の請求期間（1日〜10日）に、再請求する</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className={h2Class}>よくある質問</h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold text-stone-900">仮審査エラーが出たら、請求はできませんか？</dt>
              <dd className={pClass}>10日の締切前であれば、修正して再送信すれば当月分として処理されます。</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-900">返戻になると、報酬はどうなりますか？</dt>
              <dd className={pClass}>
                当月は支払われません。修正して再請求した分が、翌月以降の処理になります。
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-900">エラーコードはどこで調べますか？</dt>
              <dd className={pClass}>上の2つの検索ツールで調べられます。</dd>
            </div>
          </dl>
          <p className={pClass}>このページで問題が解消されない場合は、関係各所（国保連・保険者）にご確認ください。</p>
        </section>

        <section className="space-y-2 border-t border-stone-200 pt-6">
          <h2 className="text-lg font-semibold">ご利用にあたって</h2>
          <p className="text-sm leading-7 text-stone-600">
            掲載しているエラーコードは、北海道国民健康保険団体連合会と厚生労働省が公表している資料をもとにしています。最終的な判断は、国保連・保険者の案内をご確認ください。
          </p>
        </section>
      </article>
    </main>
  );
}
