import type { Metadata } from "next";
import { ShogaiErrorSearchView } from "@/components/shogai-error-search-view";

export const metadata: Metadata = {
  title: "障がい福祉エラーコード検索｜障害福祉サービス費等請求 エラー一覧",
  description:
    "障害福祉サービス費等の請求エラーコードを検索できるツール。北海道国民健康保険団体連合会のエラーメッセージ一覧と、厚生労働省公表の新規・移行エラーコード一覧をもとに収録。",
};

export default function ShogaiErrorSearchPage() {
  return (
    <main className="flex min-h-screen justify-center bg-[#faf8f2] px-3 py-6">
      <ShogaiErrorSearchView />
    </main>
  );
}
