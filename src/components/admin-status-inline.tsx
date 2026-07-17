"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export function AdminStatusInline() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white shadow-md">
      <span>管理者モード中</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium transition hover:bg-white/30"
      >
        ログアウト
      </button>
    </div>
  );
}
