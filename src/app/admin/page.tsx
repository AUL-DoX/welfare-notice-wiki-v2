import type { Metadata } from "next";
import Link from "next/link";
import { getDocumentIndex } from "@/lib/documents";
import { isAdminModeCookie } from "@/lib/admin";
import { AdminCategoryManager, type AdminDocument } from "@/components/admin-category-manager";
import { AdminStatusInline } from "@/components/admin-status-inline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理画面 | 福祉通知Wiki",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const isAdmin = await isAdminModeCookie();

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_50%,#f2f4ec_100%)] px-5 py-10 text-stone-900">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white/90 p-8 shadow-[0_24px_70px_rgba(55,43,24,0.08)]">
          <h1 className="text-2xl font-semibold">管理画面</h1>
          <p className="text-base leading-8 text-stone-700">
            この画面は管理者専用です。右下の「管理者ログイン」からログインすると、サービス種別の設定ができます。
          </p>
          <Link
            href="/"
            className="w-fit rounded-full border border-stone-300 px-5 py-3 text-base font-semibold text-stone-700 transition hover:border-amber-900 hover:text-amber-900"
          >
            トップへ戻る
          </Link>
        </div>
      </main>
    );
  }

  const { documents } = await getDocumentIndex();
  const adminDocuments: AdminDocument[] = documents.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    uploadedAt: doc.uploadedAt,
    sourceType: doc.sourceType,
    issuer: doc.issuer,
  }));

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#fcfbf8_26%,#f2f4ec_100%)] px-5 py-6 text-stone-900 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900/70">管理画面</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">サービス種別の設定</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusInline />
            <Link
              href="/"
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-amber-900 hover:text-amber-900 md:text-base"
            >
              トップへ戻る
            </Link>
          </div>
        </div>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(55,43,24,0.06)] md:p-6">
          <AdminCategoryManager documents={adminDocuments} />
        </section>
      </div>
    </main>
  );
}
