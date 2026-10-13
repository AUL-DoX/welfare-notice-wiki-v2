"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { normalizeForSearch } from "@/lib/search-normalize";

export type SearchItem = { s: "kaigo" | "shogai"; k: string; c: string; t: string };

const LABEL = { kaigo: "介護", shogai: "障がい福祉" } as const;
const MAX = 30;

export function KokuhorenSearch({ items, initialQuery }: { items: SearchItem[]; initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [service, setService] = useState<"all" | "kaigo" | "shogai">("all");

  const term = normalizeForSearch(q).toLowerCase().trim();
  const hits = useMemo(() => {
    if (!term) return [];
    const scoped = items.filter((i) => service === "all" || i.s === service);
    const exact = scoped.filter((i) => i.c.toLowerCase() === term);
    const rest = scoped.filter(
      (i) => i.c.toLowerCase() !== term && normalizeForSearch(`${i.c} ${i.t}`).toLowerCase().includes(term),
    );
    return [...exact, ...rest];
  }, [items, term, service]);

  const chip = (value: "all" | "kaigo" | "shogai", label: string) => (
    <button
      type="button"
      onClick={() => setService(value)}
      aria-pressed={service === value}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        service === value
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-amber-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="kokuhoren-q" className="mb-1 block text-sm font-semibold text-stone-700">
          エラーコードまたはメッセージの一部を入力してください
        </label>
        <input
          id="kokuhoren-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例：EG03　12PA　ANN4　EC01"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg outline-none focus:border-amber-900"
          autoComplete="off"
        />
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label="対象サービスで絞り込み">
        {chip("all", "すべて")}
        {chip("kaigo", "介護")}
        {chip("shogai", "障がい福祉")}
      </div>
      {term ? (
        hits.length === 0 ? (
          <p className="text-stone-700">
            該当するエラーコードが見つかりませんでした。メッセージの一部でも検索できます。
          </p>
        ) : (
          <div>
            <p className="mb-2 text-sm text-stone-600">
              {hits.length}件{hits.length > MAX ? `（先頭${MAX}件を表示）` : ""}
            </p>
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {hits.slice(0, MAX).map((i) => (
                <li key={`${i.s}-${i.k}`}>
                  <Link
                    href={`/kokuhoren-error/${i.s}/${encodeURIComponent(i.k)}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 hover:bg-amber-50"
                  >
                    <span className="font-mono text-base font-bold text-stone-900">{i.c}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">{LABEL[i.s]}</span>
                    <span className="text-sm text-stone-700">{i.t}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </div>
  );
}
