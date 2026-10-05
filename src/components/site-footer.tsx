import Link from "next/link";

// 運営者情報・お問い合わせは親サイト（aul-dox.jp）の既存ページを案内する。
const OPERATOR_URL = "https://aul-dox.jp/%E9%81%8B%E5%96%B6%E8%80%85/";
const CONTACT_URL = "https://aul-dox.jp/%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B/";

const linkClass =
  "text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-amber-900 hover:decoration-amber-900";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200/70 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="サイト情報">
          <Link href="/privacy" className={linkClass}>
            プライバシーポリシー
          </Link>
          <a href={OPERATOR_URL} className={linkClass} target="_blank" rel="noreferrer">
            運営者情報
          </a>
          <a href={CONTACT_URL} className={linkClass} target="_blank" rel="noreferrer">
            お問い合わせ
          </a>
        </nav>
        <p className="text-xs text-stone-500">© AUL DoX</p>
      </div>
    </footer>
  );
}
