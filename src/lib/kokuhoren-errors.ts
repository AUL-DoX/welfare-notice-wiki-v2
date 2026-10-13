import henreiRaw from "@/data/henrei-search.json";
import shogaiRaw from "@/data/shogai-error-search.json";
import { parseContent, type ContentBlock, type HenreiData } from "@/lib/henrei-search";
import type { ShogaiData } from "@/lib/shogai-error-search";

export type ErrorService = "kaigo" | "shogai";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wn-wiki.aul-dox.jp";
export const HUB_PATH = "/kokuhoren-error";

// 収録データを最後に出典と突き合わせて確認した月。データ更新時はここも更新する。
export const LAST_VERIFIED = "2026年10月";

export const SERVICE_LABEL: Record<ErrorService, string> = {
  kaigo: "介護",
  shogai: "障がい福祉",
};

export const SERVICE_FULL_LABEL: Record<ErrorService, string> = {
  kaigo: "介護給付費等（介護保険請求）",
  shogai: "障害福祉サービス費等（障害福祉サービス請求）",
};

export interface KokuhorenError {
  service: ErrorService;
  /** URLに使う識別子（データ上のキー） */
  key: string;
  code: string;
  title: string;
  /** 原因（障がい福祉は原本の記載、介護は原本の「原因」節） */
  cause?: string;
  /** 対応方法 */
  remedy?: string;
  /** 介護の返戻事例・Pointなど、原因／対応方法以外の節 */
  extraBlocks: { label: string; text: string }[];
  /** 原因・対応方法まで解説された収録か（false は一覧のみの簡易収録） */
  detailed: boolean;
  sourceName: string;
  sourceKind: string;
}

const CODE_PATTERN = /^[A-Z0-9]{2,8}$/;

const SRC_HOKKAIDO_KAIGO = "北海道国民健康保険団体連合会";
const SRC_HOKKAIDO_SHOGAI = "北海道国民健康保険団体連合会";
const SRC_MHLW = "厚生労働省 社会・援護局 障害保健福祉部";

function buildKaigo(): KokuhorenError[] {
  const data = henreiRaw as unknown as HenreiData;
  const result: KokuhorenError[] = [];
  for (const key of data.order) {
    const e = data.entries[key];
    if (!e.code || !CODE_PATTERN.test(e.code)) continue;
    let cause: string | undefined;
    let remedy: string | undefined;
    const extraBlocks: { label: string; text: string }[] = [];
    if (e.content) {
      const blocks: ContentBlock[] = parseContent(e.content);
      for (const b of blocks) {
        if (b.type !== "section") continue;
        if (b.label === "原因") cause = b.text;
        else if (b.label === "対応方法") remedy = b.text;
        else extraBlocks.push({ label: b.label, text: b.text });
      }
    }
    result.push({
      service: "kaigo",
      key,
      code: e.code,
      title: e.title,
      cause,
      remedy,
      extraBlocks,
      detailed: !!e.content,
      sourceName: SRC_HOKKAIDO_KAIGO,
      sourceKind: e.content
        ? "返戻対応マニュアル（介護給付費等請求）"
        : "介護給付費等 エラーコード一覧（返戻対応マニュアル付属）",
    });
  }
  return result;
}

function buildShogai(): KokuhorenError[] {
  const data = shogaiRaw as unknown as ShogaiData;
  return data.order.map((key) => {
    const e = data.entries[key];
    const brief = !!e.brief;
    return {
      service: "shogai" as const,
      key,
      code: e.code,
      title: e.title,
      cause: e.cause,
      remedy: e.remedy,
      extraBlocks: [],
      detailed: !brief,
      sourceName: brief ? SRC_MHLW : SRC_HOKKAIDO_SHOGAI,
      sourceKind: brief
        ? e.source === "r9"
          ? "「警告」から「エラー（返戻）」へ移行するエラーコード一覧（令和9年1月審査対応）"
          : "審査機能強化等対応に係る新規エラーコード一覧（令和8年7月審査対応）"
        : "障害者総合支援請求情報エラーメッセージ一覧（令和5年7月）",
    };
  });
}

let cache: Record<ErrorService, KokuhorenError[]> | null = null;

function all() {
  cache ??= { kaigo: buildKaigo(), shogai: buildShogai() };
  return cache;
}

export function isErrorService(value: string): value is ErrorService {
  return value === "kaigo" || value === "shogai";
}

export function getErrors(service: ErrorService): KokuhorenError[] {
  return all()[service];
}

export function getError(service: ErrorService, key: string): KokuhorenError | undefined {
  return all()[service].find((e) => e.key === key);
}

export function errorPath(e: Pick<KokuhorenError, "service" | "key">): string {
  return `${HUB_PATH}/${e.service}/${encodeURIComponent(e.key)}`;
}

export function servicePath(service: ErrorService): string {
  return `${HUB_PATH}/${service}`;
}

/** 同じサービスで、コードの先頭2文字が共通する別のエラー（解説付きを優先）。 */
export function getRelatedErrors(e: KokuhorenError, limit = 8): KokuhorenError[] {
  const prefix = e.code.slice(0, 2);
  return getErrors(e.service)
    .filter((o) => o.key !== e.key && o.code.slice(0, 2) === prefix)
    .sort((a, b) => Number(b.detailed) - Number(a.detailed))
    .slice(0, limit);
}

export function errorTitle(e: KokuhorenError): string {
  return `${e.code}とは？国保連請求エラーの原因と確認方法｜${SERVICE_LABEL[e.service]}`;
}

export function errorDescription(e: KokuhorenError): string {
  const svc = e.service === "shogai" ? "障害福祉サービス" : "介護給付費等";
  return e.detailed
    ? `${svc}の国保連請求で表示される${e.code}（${e.title.slice(0, 40)}）について、主な原因、確認項目、対応方法、一次情報を整理しています。`
    : `${svc}の国保連請求のエラーコード${e.code}（${e.title.slice(0, 50)}）の一覧情報と、関連エラー・一次情報への案内です。`;
}
