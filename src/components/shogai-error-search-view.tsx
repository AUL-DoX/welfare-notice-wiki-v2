"use client";

import { useEffect, useMemo, useState } from "react";
import rawData from "@/data/shogai-error-search.json";
import {
  type ShogaiData,
  type ShogaiEntry,
  highlightParts,
  isBrief,
  matchesEntry,
} from "@/lib/shogai-error-search";

const DATA = rawData as unknown as ShogaiData;

export function ShogaiErrorSearchView() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const term = query.trim();
  const normalizedTerm = term.toLowerCase();

  const filteredKeys = useMemo(
    () => DATA.order.filter((key) => matchesEntry(DATA.entries[key], normalizedTerm)),
    [normalizedTerm],
  );

  const openEntry = openKey ? DATA.entries[openKey] : null;

  useEffect(() => {
    if (!openEntry) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenKey(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openEntry]);

  const detailCount = DATA.order.filter((k) => !isBrief(DATA.entries[k])).length;
  const briefCount = DATA.order.length - detailCount;

  return (
    <div className="aulssw-page-wrap">
      <div className="aulssw">
        <div className="aulssw-header">
          <div className="aulssw-headwrap">
            <div className="aulssw-eyebrow">障害福祉サービス費等 請求エラー対応</div>
            <h1 className="aulssw-title">障がい福祉エラーコード検索</h1>
            <div className="aulssw-searchbar">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="エラーコードまたはキーワードを入力（例：EG27 / AC01 / 決定支給量）"
                autoComplete="off"
              />
              <span className="aulssw-count">
                {filteredKeys.length} / {DATA.order.length} 件
              </span>
            </div>
          </div>
        </div>

        <div className="aulssw-main">
          <div className="aulssw-hint">
            コード（例 <b>EG27</b>）またはメッセージの一部を入力すると絞り込まれます。全{" "}
            <b>{DATA.order.length}</b> 件収録。
          </div>
          <div className="aulssw-legend">
            <span>
              <span className="aulssw-dot d" />
              原因・対処方法つき（北海道国保連 障害者総合支援請求情報エラーメッセージ一覧）{detailCount}件
            </span>
            <span>
              <span className="aulssw-dot b" />
              新規・移行エラーコード一覧（厚労省 令和8年7月／令和9年1月審査対応）{briefCount}件
            </span>
          </div>

          {filteredKeys.length === 0 ? (
            <div className="aulssw-empty">
              該当するエラーコード・メッセージが見つかりませんでした。
              <span className="aulssw-empty-note">
                ※ 本ツールは令和5年7月版マニュアル及び令和8年6月公表の新規・移行エラーコード一覧をもとに収録しています。これ以降に追加・変更されたエラーコードは反映されていない場合があります。
              </span>
            </div>
          ) : (
            <ul className="aulssw-results">
              {filteredKeys.map((key) => {
                const entry = DATA.entries[key];
                const brief = isBrief(entry);
                return (
                  <li
                    key={key}
                    className={`aulssw-row${brief ? " aulssw-is-brief" : ""}`}
                    onClick={() => setOpenKey(key)}
                  >
                    <div className="aulssw-rowtop">
                      <span className={`aulssw-code${brief ? " aulssw-brief" : ""}`}>
                        <Highlighted text={entry.code} term={term} />
                      </span>
                      {brief ? (
                        <span className="aulssw-badge-brief">
                          {entry.source === "r9" ? "R9.1移行" : "R8.7新規"}
                        </span>
                      ) : null}
                      <span className="aulssw-rowtitle">
                        <Highlighted text={entry.title} term={term} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="aulssw-footer">
          原本：障害者総合支援請求情報エラーメッセージ一覧（令和5年7月）北海道国民健康保険団体連合会／審査機能強化等対応に係る新規エラーコード一覧・「警告」から「エラー（返戻）」へ移行するエラーコード一覧（令和8年6月2日）厚生労働省社会・援護局障害保健福祉部企画課
        </div>

        {openEntry ? (
          <div
            className="aulssw-overlay aulssw-show"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpenKey(null);
            }}
          >
            <DetailPanel entry={openEntry} onClose={() => setOpenKey(null)} />
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        .aulssw {
          --aulssw-ink: #000000;
          --aulssw-paper: #faf8f2;
          --aulssw-panel: #ffffff;
          --aulssw-line: #e3ddcd;
          --aulssw-navy: #2c4a63;
          --aulssw-navy-soft: #5b7690;
          --aulssw-clay: #c1633f;
          --aulssw-clay-soft: #f5e6db;
          --aulssw-sun: #f4ede0;
          --aulssw-sun-line: #e6d9bd;
          --aulssw-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          --aulssw-serif: "Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif;
          --aulssw-sans: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif;

          display: block;
          background: var(--aulssw-paper);
          color: var(--aulssw-ink);
          font-family: var(--aulssw-sans);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--aulssw-line);
        }
        .aulssw-page-wrap {
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
        }
        .aulssw,
        .aulssw * {
          box-sizing: border-box;
        }
        .aulssw * {
          font-family: inherit;
          line-height: inherit;
        }
        .aulssw a {
          color: inherit;
        }

        .aulssw .aulssw-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: linear-gradient(180deg, #fffdf8 0%, var(--aulssw-sun) 100%);
          color: var(--aulssw-navy);
          padding: 18px 20px 16px;
          border-bottom: 3px solid var(--aulssw-clay);
        }
        .aulssw .aulssw-headwrap {
          max-width: 960px;
          margin: 0 auto;
        }
        .aulssw .aulssw-eyebrow {
          font-size: 14.3px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--aulssw-clay);
          margin-bottom: 4px;
          font-weight: 700;
        }
        .aulssw h1.aulssw-title {
          font-family: var(--aulssw-serif);
          font-size: 28.6px;
          margin: 0 0 12px;
          font-weight: 600;
          color: var(--aulssw-navy);
          letter-spacing: 0.02em;
        }
        .aulssw .aulssw-searchbar {
          display: flex;
          gap: 8px;
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--aulssw-sun-line);
          border-radius: 8px;
          padding: 6px 6px 6px 14px;
          box-shadow: 0 1px 3px rgba(80, 60, 20, 0.06);
        }
        .aulssw .aulssw-searchbar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--aulssw-ink);
          font-size: 20.8px;
          font-family: var(--aulssw-mono);
          padding: 10px 4px;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: none;
          min-height: 0;
          height: auto;
          width: 100%;
        }
        .aulssw .aulssw-searchbar input::placeholder {
          color: #a39d8a;
          font-family: var(--aulssw-sans);
        }
        .aulssw .aulssw-searchbar .aulssw-count {
          font-size: 15.6px;
          color: var(--aulssw-navy-soft);
          white-space: nowrap;
          padding-right: 6px;
          font-family: var(--aulssw-mono);
        }
        .aulssw .aulssw-main {
          max-width: 960px;
          margin: 0 auto;
          padding: 18px 20px 60px;
        }
        .aulssw .aulssw-hint {
          font-size: 16.9px;
          color: #7a7460;
          margin: 2px 2px 6px;
        }
        .aulssw .aulssw-hint b {
          color: var(--aulssw-navy);
        }
        .aulssw .aulssw-legend {
          font-size: 15.6px;
          color: #948d78;
          margin: 0 2px 16px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .aulssw .aulssw-legend span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .aulssw .aulssw-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }
        .aulssw .aulssw-dot.d {
          background: var(--aulssw-navy);
        }
        .aulssw .aulssw-dot.b {
          background: var(--aulssw-clay);
          opacity: 0.55;
        }

        .aulssw ul.aulssw-results {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .aulssw li.aulssw-row {
          background: var(--aulssw-panel);
          border: 1px solid var(--aulssw-line);
          border-radius: 8px;
          padding: 12px 14px;
          cursor: pointer;
          transition: border-color 0.12s, transform 0.06s;
          list-style: none;
        }
        .aulssw li.aulssw-row:hover {
          border-color: var(--aulssw-clay);
        }
        .aulssw li.aulssw-row:active {
          transform: scale(0.997);
        }
        .aulssw li.aulssw-row.aulssw-is-brief {
          background: #fdfcf8;
        }
        .aulssw .aulssw-rowtop {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .aulssw .aulssw-code {
          font-family: var(--aulssw-mono);
          font-weight: 700;
          font-size: 18.2px;
          background: var(--aulssw-navy);
          color: #fbf6e9;
          padding: 2px 8px;
          border-radius: 5px;
          letter-spacing: 0.03em;
          flex-shrink: 0;
          display: inline-block;
        }
        .aulssw .aulssw-code.aulssw-brief {
          background: #ffffff;
          color: var(--aulssw-navy);
          border: 1.5px solid var(--aulssw-navy);
        }
        .aulssw .aulssw-badge-brief {
          font-size: 13.65px;
          color: var(--aulssw-clay);
          border: 1px solid var(--aulssw-clay);
          border-radius: 999px;
          padding: 1px 8px;
          flex-shrink: 0;
          opacity: 0.85;
          white-space: nowrap;
        }
        .aulssw .aulssw-rowtitle {
          font-size: 18.85px;
          color: var(--aulssw-ink);
          font-weight: 500;
        }
        .aulssw mark {
          background: #ffe28a;
          color: inherit;
          border-radius: 2px;
          padding: 0 1px;
        }
        .aulssw .aulssw-empty {
          padding: 40px 10px;
          text-align: center;
          color: #948d78;
          font-size: 18.2px;
        }
        .aulssw .aulssw-empty .aulssw-empty-note {
          display: block;
          margin-top: 10px;
          font-size: 16.25px;
          color: #9a6a52;
          background: var(--aulssw-clay-soft);
          border-radius: 6px;
          padding: 10px 14px;
          text-align: left;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        .aulssw .aulssw-overlay {
          position: fixed;
          inset: 0;
          background: rgba(40, 35, 20, 0.38);
          display: none;
          align-items: flex-start;
          justify-content: center;
          padding: 30px 16px;
          z-index: 9999;
          overflow-y: auto;
        }
        .aulssw .aulssw-overlay.aulssw-show {
          display: flex;
        }
        .aulssw .aulssw-detail {
          background: var(--aulssw-panel);
          border-radius: 10px;
          max-width: 760px;
          width: 100%;
          padding: 26px 26px 34px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          margin-bottom: 40px;
          color: var(--aulssw-ink);
          text-align: left;
        }
        .aulssw .aulssw-detail-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 6px;
        }
        .aulssw .aulssw-detail-code-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .aulssw .aulssw-closebtn {
          background: none;
          border: 1px solid var(--aulssw-line);
          border-radius: 6px;
          color: #948d78;
          width: 32px;
          height: 32px;
          font-size: 20.8px;
          cursor: pointer;
          flex-shrink: 0;
          line-height: 1;
        }
        .aulssw .aulssw-closebtn:hover {
          border-color: var(--aulssw-clay);
          color: var(--aulssw-clay);
        }
        .aulssw .aulssw-detail-title {
          font-family: var(--aulssw-serif);
          font-size: 22px;
          font-weight: 600;
          margin: 10px 0 4px;
          color: var(--aulssw-navy);
        }
        .aulssw .aulssw-detail-pages {
          font-size: 15.6px;
          color: #9a927e;
          margin-bottom: 18px;
          font-family: var(--aulssw-mono);
        }
        .aulssw .aulssw-section {
          margin: 14px 0;
        }
        .aulssw .aulssw-section h3 {
          font-size: 16.25px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--aulssw-navy);
          background: var(--aulssw-clay-soft);
          display: inline-block;
          padding: 3px 10px;
          border-radius: 5px;
          margin: 0 0 8px;
        }
        .aulssw .aulssw-section .aulssw-body {
          white-space: pre-wrap;
          font-size: 17.5px;
          color: #000000;
        }
        .aulssw .aulssw-plain {
          white-space: pre-wrap;
          font-size: 18.85px;
          color: #000000;
        }
        .aulssw .aulssw-brief-note {
          font-size: 16.9px;
          color: #7a7460;
          background: #f6f2e6;
          border-radius: 6px;
          padding: 10px 14px;
          margin-top: 14px;
        }
        .aulssw .aulssw-footer {
          max-width: 960px;
          margin: 0 auto;
          padding: 14px 20px 26px;
          color: #9a927e;
          font-size: 15.6px;
        }
        @media (max-width: 600px) {
          .aulssw h1.aulssw-title {
            font-size: 24.7px;
          }
          .aulssw .aulssw-detail {
            padding: 20px 18px 28px;
          }
        }
      `}</style>
    </div>
  );
}

function Highlighted({ text, term }: { text: string; term: string }) {
  const parts = highlightParts(text, term);
  return (
    <>
      {parts.map((part, index) =>
        part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}

function DetailPanel({ entry, onClose }: { entry: ShogaiEntry; onClose: () => void }) {
  const brief = isBrief(entry);

  return (
    <div className="aulssw-detail">
      <div className="aulssw-detail-head">
        <div className="aulssw-detail-code-row">
          <span className={`aulssw-code${brief ? " aulssw-brief" : ""}`}>{entry.code}</span>
          {brief ? (
            <span className="aulssw-badge-brief">{entry.source === "r9" ? "R9.1移行" : "R8.7新規"}</span>
          ) : null}
        </div>
        <button className="aulssw-closebtn" aria-label="閉じる" type="button" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="aulssw-detail-title">{entry.title}</div>

      {brief ? (
        <>
          <div className="aulssw-detail-pages">
            {entry.source === "r9"
              ? "「警告」から「エラー（返戻）」へ移行するエラーコード一覧（令和9年1月審査対応）"
              : "審査機能強化等対応に係る新規エラーコード一覧（令和8年7月審査対応）"}
          </div>
          <div className="aulssw-brief-note">
            厚生労働省公表の新規・移行エラーコード一覧に収録されているコードです。原因・対処方法の詳しい解説は北海道国保連マニュアルへの反映後に追記予定です。
          </div>
        </>
      ) : (
        <>
          <div className="aulssw-detail-pages">原本：障害者総合支援請求情報エラーメッセージ一覧（令和5年7月）</div>
          {entry.cause ? (
            <div className="aulssw-section">
              <h3>原因</h3>
              <div className="aulssw-body">{entry.cause}</div>
            </div>
          ) : null}
          {entry.remedy ? (
            <div className="aulssw-section">
              <h3>対処方法</h3>
              <div className="aulssw-body">{entry.remedy}</div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
