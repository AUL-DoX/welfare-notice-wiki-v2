import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { isAdminModeCookie } from "@/lib/admin";
import { AdminBar } from "@/components/admin-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://wn-wiki.aul-dox.jp"),
  title: "介護と障害福祉サービスの通知文Wiki",
  description:
    "介護と障害福祉サービスの通知文を検索し、詳細ページで該当の単語や文章を強調表示できる検索ページです。",
  // リンクカード（note・X等）用。画像は app/opengraph-image.png / twitter-image.png が自動で og:image になる。
  // og:title / og:description はここで固定しない（固定すると全ページ共通になり、各ページ固有のタイトルが使われなくなる）。
  openGraph: {
    type: "website",
    siteName: "介護と障害福祉サービスの通知文Wiki",
    locale: "ja_JP",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await isAdminModeCookie();

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
        <AdminBar isAdmin={isAdmin} />
        <Analytics />
      </body>
    </html>
  );
}
