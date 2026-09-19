"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "トップページ" },
  { href: "/updates", label: "更新情報" },
  { href: "/henrei-search", label: "返戻対応マニュアル検索" },
  { href: "/shogai-error-search", label: "障がい福祉エラーコード検索" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold uppercase tracking-[0.2em] text-amber-900/80 transition hover:text-amber-900"
        >
          AUL Welfare Notice DB
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  isActive ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
