"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function WatchLinkPromoteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/watch-links/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "保存に失敗しました。");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="whitespace-nowrap rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-black shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "保存中..." : "保存する"}
      </button>
      {error ? <p className="max-w-[16rem] text-right text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
