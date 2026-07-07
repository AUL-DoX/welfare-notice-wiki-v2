import type { Metadata } from "next";
import { HenreiSearchView } from "@/components/henrei-search-view";

export const metadata: Metadata = {
  title: "返戻対応マニュアル検索｜介護給付費等請求 エラーコード一覧",
  description:
    "介護給付費等の請求返戻・エラーコードを検索できるツール。北海道国民健康保険団体連合会の返戻対応マニュアルとエラーコード一覧をもとに、詳細解説100件・簡易版449件、計549件を収録。",
};

export default function HenreiSearchPage() {
  return (
    <main className="flex min-h-screen justify-center bg-[#faf8f2] px-3 py-6">
      <HenreiSearchView />
    </main>
  );
}
