import Link from "next/link";
import { BASE_URL } from "@/lib/kokuhoren-errors";
import { JsonLd } from "@/components/json-ld";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${BASE_URL}${c.href}`,
          })),
        }}
      />
      <nav aria-label="パンくずリスト" className="text-sm text-stone-600">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((c, i) => (
            <li key={c.href} className="flex items-center gap-x-2">
              {i > 0 ? <span aria-hidden="true">›</span> : null}
              {i < items.length - 1 ? (
                <Link href={c.href} className="underline decoration-stone-300 underline-offset-4 hover:text-amber-900">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
