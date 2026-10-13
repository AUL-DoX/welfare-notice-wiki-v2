import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  HUB_PATH,
  SERVICE_FULL_LABEL,
  SERVICE_LABEL,
  errorPath,
  getErrors,
  isErrorService,
  servicePath,
  type ErrorService,
  type KokuhorenError,
} from "@/lib/kokuhoren-errors";

type Props = { params: Promise<{ service: string }> };

export function generateStaticParams() {
  return [{ service: "kaigo" }, { service: "shogai" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  if (!isErrorService(service)) return {};
  const title = `${SERVICE_LABEL[service]}の国保連請求エラーコード一覧｜返戻・仮審査の原因と確認方法`;
  const description = `${SERVICE_FULL_LABEL[service]}の国保連請求で表示されるエラーコード${getErrors(service).length}件を一覧にしています。コードから原因・確認方法・一次情報をたどれます。`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: servicePath(service) },
    openGraph: { title, description },
  };
}

function groups(service: ErrorService): { heading: string; items: KokuhorenError[] }[] {
  const list = getErrors(service);
  const detailed = { heading: "原因・対応方法つきのエラーコード", items: list.filter((e) => e.detailed) };
  const rest =
    service === "shogai"
      ? { heading: "新規・移行エラーコード（令和8年7月／令和9年1月審査対応）", items: list.filter((e) => !e.detailed) }
      : { heading: "エラーコード一覧（メッセージのみ収録）", items: list.filter((e) => !e.detailed) };
  return [detailed, rest];
}

export default async function ServiceErrorListPage({ params }: Props) {
  const { service } = await params;
  if (!isErrorService(service)) notFound();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-8 text-stone-900 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <Breadcrumbs
          items={[
            { name: "ホーム", href: "/" },
            { name: "国保連請求エラー検索", href: HUB_PATH },
            { name: SERVICE_LABEL[service], href: servicePath(service) },
          ]}
        />
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">
            {SERVICE_LABEL[service]}の国保連請求エラーコード一覧
          </h1>
          <p className="leading-8 text-stone-700">
            {SERVICE_FULL_LABEL[service]}の国保連請求で表示されるエラーコードの一覧です。コードを選ぶと、原因、確認すること、対応方法、一次情報を確認できます。コードやメッセージで探す場合は
            <Link href={HUB_PATH} className="underline underline-offset-4 hover:text-amber-900">
              国保連請求エラー検索
            </Link>
            をご利用ください。
          </p>
        </header>

        {groups(service).map((g) => (
          <section key={g.heading} className="space-y-3">
            <h2 className="text-xl font-semibold">
              {g.heading}（{g.items.length}件）
            </h2>
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {g.items.map((e) => (
                <li key={e.key}>
                  <Link href={errorPath(e)} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5 hover:bg-amber-50">
                    <span className="w-20 shrink-0 font-mono font-bold">{e.code}</span>
                    <span className="min-w-0 flex-1 text-sm text-stone-700">{e.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="border-t border-stone-200 pt-6 text-sm leading-7 text-stone-600">
          本ページは国保連・自治体等の公開情報を検索しやすく整理したものです。実際の請求処理や制度判断については、必ず国保連・自治体等の一次情報をご確認ください。
        </p>
      </div>
    </main>
  );
}
