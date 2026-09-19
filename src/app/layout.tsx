import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { isAdminModeCookie } from "@/lib/admin";
import { AdminBar } from "@/components/admin-bar";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "介護・障がい福祉の行政情報データベース",
  description:
    "介護・障がい福祉サービスに関する行政通知文を検索し、詳細ページで該当の単語や文章を強調表示できるデータベースです。",
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
        <AdminBar isAdmin={isAdmin} />
        <Analytics />
      </body>
    </html>
  );
}
