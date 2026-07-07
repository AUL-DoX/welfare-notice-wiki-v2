"use client";

import { useEffect, useMemo, useState } from "react";
import rawHenreiData from "@/data/henrei-search.json";
import {
  type HenreiData,
  type HenreiEntry,
  highlightParts,
  isBrief,
  matchesEntry,
  parseContent,
} from "@/lib/henrei-search";

const DATA = rawHenreiData as unknown as HenreiData;

export function HenreiSearchView() {
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

  return (
    <div className="aulrtm-page-wrap">
      <div className="aulrtm">
        <div className="aulrtm-header">
          <div className="aulrtm-headwrap">
            <div className="aulrtm-eyebrow">介護給付費等 請求返戻対応</div>
            <h1 className="aulrtm-title">返戻対応マニュアル検索</h1>
            <div className="aulrtm-searchbar">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="エラーコードまたはキーワードを入力（例：1004 / AEE2 / 給付管理票）"
                autoComplete="off"
              />
              <span className="aulrtm-count">
                {filteredKeys.length} / {DATA.order.length} 件
              </span>
            </div>
          </div>
        </div>

        <div className="aulrtm-main">
          <div className="aulrtm-hint">
            コード（例 <b>1004</b>）またはメッセージの一部を入力すると絞り込まれます。全{" "}
            <b>{DATA.order.length}</b> 件収録。
          </div>
          <div className="aulrtm-legend">
            <span>
              <span className="aulrtm-dot d" />
              詳細解説あり（原因・対応方法つき）100件
            </span>
            <span>
              <span className="aulrtm-dot b" />
              簡易版（コード一覧より）449件
            </span>
          </div>

          {filteredKeys.length === 0 ? (
            <div className="aulrtm-empty">
              該当するエラーコード・メッセージが見つかりませんでした。
              <span className="aulrtm-empty-note">
                ※ 令和8年6月の処遇改善加算の期中改定（介護従事者処遇改善加算への改称・区分イ／ロの新設等）に伴う新しいエラーコードは、本ツールの収録データにはまだ反映されていません。該当しそうな場合は、国保連合会へ直接お問い合わせいただくか、最新版の公開状況をご確認ください。
              </span>
            </div>
          ) : (
            <ul className="aulrtm-results">
              {filteredKeys.map((key) => {
                const entry = DATA.entries[key];
                const brief = isBrief(entry);
                return (
                  <li
                    key={key}
                    className={`aulrtm-row${brief ? " aulrtm-is-brief" : ""}`}
                    onClick={() => setOpenKey(key)}
                  >
                    <div className="aulrtm-rowtop">
                      {entry.code ? (
                        <span className={`aulrtm-code${brief ? " aulrtm-brief" : ""}`}>
                          <Highlighted text={entry.code} term={term} />
                        </span>
                      ) : (
                        <span className="aulrtm-code aulrtm-msg">メッセージ</span>
                      )}
                      {brief ? <span className="aulrtm-badge-brief">簡易版</span> : null}
                      <span className="aulrtm-rowtitle">
                        <Highlighted text={entry.title} term={term} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="aulrtm-footer">
          原本：返戻対応マニュアル（介護請求）R06.02.01／エラーコード一覧（令和7年9月以降審査分）｜北海道国民健康保険団体連合会
        </div>

        {openEntry ? (
          <div
            className="aulrtm-overlay aulrtm-show"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpenKey(null);
            }}
          >
            <DetailPanel entry={openEntry} onClose={() => setOpenKey(null)} />
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        .aulrtm {
          --aulrtm-ink: #000000;
          --aulrtm-paper: #faf8f2;
          --aulrtm-panel: #ffffff;
          --aulrtm-line: #e3ddcd;
          --aulrtm-navy: #2c4a63;
          --aulrtm-navy-soft: #5b7690;
          --aulrtm-clay: #c1633f;
          --aulrtm-clay-soft: #f5e6db;
          --aulrtm-sun: #f4ede0;
          --aulrtm-sun-line: #e6d9bd;
          --aulrtm-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          --aulrtm-serif: "Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif;
          --aulrtm-sans: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif;

          display: block;
          background: var(--aulrtm-paper);
          color: var(--aulrtm-ink);
          font-family: var(--aulrtm-sans);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--aulrtm-line);
        }
        .aulrtm-page-wrap {
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
        }
        .aulrtm,
        .aulrtm * {
          box-sizing: border-box;
        }
        .aulrtm * {
          font-family: inherit;
          line-height: inherit;
        }
        .aulrtm a {
          color: inherit;
        }

        .aulrtm .aulrtm-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: linear-gradient(180deg, #fffdf8 0%, var(--aulrtm-sun) 100%);
          color: var(--aulrtm-navy);
          padding: 18px 20px 16px;
          border-bottom: 3px solid var(--aulrtm-clay);
        }
        .aulrtm .aulrtm-headwrap {
          max-width: 960px;
          margin: 0 auto;
        }
        .aulrtm .aulrtm-eyebrow {
          font-size: 14.3px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--aulrtm-clay);
          margin-bottom: 4px;
          font-weight: 700;
        }
        .aulrtm h1.aulrtm-title {
          font-family: var(--aulrtm-serif);
          font-size: 28.6px;
          margin: 0 0 12px;
          font-weight: 600;
          color: var(--aulrtm-navy);
          letter-spacing: 0.02em;
        }
        .aulrtm .aulrtm-searchbar {
          display: flex;
          gap: 8px;
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--aulrtm-sun-line);
          border-radius: 8px;
          padding: 6px 6px 6px 14px;
          box-shadow: 0 1px 3px rgba(80, 60, 20, 0.06);
        }
        .aulrtm .aulrtm-searchbar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--aulrtm-ink);
          font-size: 20.8px;
          font-family: var(--aulrtm-mono);
          padding: 10px 4px;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: none;
          min-height: 0;
          height: auto;
          width: 100%;
        }
        .aulrtm .aulrtm-searchbar input::placeholder {
          color: #a39d8a;
          font-family: var(--aulrtm-sans);
        }
        .aulrtm .aulrtm-searchbar .aulrtm-count {
          font-size: 15.6px;
          color: var(--aulrtm-navy-soft);
          white-space: nowrap;
          padding-right: 6px;
          font-family: var(--aulrtm-mono);
        }
        .aulrtm .aulrtm-main {
          max-width: 960px;
          margin: 0 auto;
          padding: 18px 20px 60px;
        }
        .aulrtm .aulrtm-hint {
          font-size: 16.9px;
          color: #7a7460;
          margin: 2px 2px 6px;
        }
        .aulrtm .aulrtm-hint b {
          color: var(--aulrtm-navy);
        }
        .aulrtm .aulrtm-legend {
          font-size: 15.6px;
          color: #948d78;
          margin: 0 2px 16px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .aulrtm .aulrtm-legend span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .aulrtm .aulrtm-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }
        .aulrtm .aulrtm-dot.d {
          background: var(--aulrtm-navy);
        }
        .aulrtm .aulrtm-dot.b {
          background: var(--aulrtm-clay);
          opacity: 0.55;
        }

        .aulrtm ul.aulrtm-results {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .aulrtm li.aulrtm-row {
          background: var(--aulrtm-panel);
          border: 1px solid var(--aulrtm-line);
          border-radius: 8px;
          padding: 12px 14px;
          cursor: pointer;
          transition: border-color 0.12s, transform 0.06s;
          list-style: none;
        }
        .aulrtm li.aulrtm-row:hover {
          border-color: var(--aulrtm-clay);
        }
        .aulrtm li.aulrtm-row:active {
          transform: scale(0.997);
        }
        .aulrtm li.aulrtm-row.aulrtm-is-brief {
          background: #fdfcf8;
        }
        .aulrtm .aulrtm-rowtop {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .aulrtm .aulrtm-code {
          font-family: var(--aulrtm-mono);
          font-weight: 700;
          font-size: 18.2px;
          background: var(--aulrtm-navy);
          color: #fbf6e9;
          padding: 2px 8px;
          border-radius: 5px;
          letter-spacing: 0.03em;
          flex-shrink: 0;
          display: inline-block;
        }
        .aulrtm .aulrtm-code.aulrtm-msg {
          background: var(--aulrtm-clay);
        }
        .aulrtm .aulrtm-code.aulrtm-brief {
          background: #ffffff;
          color: var(--aulrtm-navy);
          border: 1.5px solid var(--aulrtm-navy);
        }
        .aulrtm .aulrtm-badge-brief {
          font-size: 13.65px;
          color: var(--aulrtm-clay);
          border: 1px solid var(--aulrtm-clay);
          border-radius: 999px;
          padding: 1px 8px;
          flex-shrink: 0;
          opacity: 0.85;
        }
        .aulrtm .aulrtm-rowtitle {
          font-size: 18.85px;
          color: var(--aulrtm-ink);
          font-weight: 500;
        }
        .aulrtm mark {
          background: #ffe28a;
          color: inherit;
          border-radius: 2px;
          padding: 0 1px;
        }
        .aulrtm .aulrtm-empty {
          padding: 40px 10px;
          text-align: center;
          color: #948d78;
          font-size: 18.2px;
        }
        .aulrtm .aulrtm-empty .aulrtm-empty-note {
          display: block;
          margin-top: 10px;
          font-size: 16.25px;
          color: #9a6a52;
          background: var(--aulrtm-clay-soft);
          border-radius: 6px;
          padding: 10px 14px;
          text-align: left;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        .aulrtm .aulrtm-overlay {
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
        .aulrtm .aulrtm-overlay.aulrtm-show {
          display: flex;
        }
        .aulrtm .aulrtm-detail {
          background: var(--aulrtm-panel);
          border-radius: 10px;
          max-width: 760px;
          width: 100%;
          padding: 26px 26px 34px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          margin-bottom: 40px;
          color: var(--aulrtm-ink);
          text-align: left;
        }
        .aulrtm .aulrtm-detail-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 6px;
        }
        .aulrtm .aulrtm-detail-code-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .aulrtm .aulrtm-closebtn {
          background: none;
          border: 1px solid var(--aulrtm-line);
          border-radius: 6px;
          color: #948d78;
          width: 32px;
          height: 32px;
          font-size: 20.8px;
          cursor: pointer;
          flex-shrink: 0;
          line-height: 1;
        }
        .aulrtm .aulrtm-closebtn:hover {
          border-color: var(--aulrtm-clay);
          color: var(--aulrtm-clay);
        }
        .aulrtm .aulrtm-detail-title {
          font-family: var(--aulrtm-serif);
          font-size: 24.7px;
          font-weight: 600;
          margin: 10px 0 4px;
          color: var(--aulrtm-navy);
        }
        .aulrtm .aulrtm-detail-pages {
          font-size: 15.6px;
          color: #9a927e;
          margin-bottom: 18px;
          font-family: var(--aulrtm-mono);
        }
        .aulrtm .aulrtm-section {
          margin: 14px 0;
        }
        .aulrtm .aulrtm-section h3 {
          font-size: 16.25px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--aulrtm-navy);
          background: var(--aulrtm-clay-soft);
          display: inline-block;
          padding: 3px 10px;
          border-radius: 5px;
          margin: 0 0 8px;
        }
        .aulrtm .aulrtm-section .aulrtm-body {
          white-space: pre-wrap;
          font-size: 18.85px;
          color: #000000;
        }
        .aulrtm .aulrtm-plain {
          white-space: pre-wrap;
          font-size: 18.85px;
          color: #000000;
        }
        .aulrtm .aulrtm-brief-note {
          font-size: 16.9px;
          color: #7a7460;
          background: #f6f2e6;
          border-radius: 6px;
          padding: 10px 14px;
          margin-top: 14px;
        }
        .aulrtm .aulrtm-footer {
          max-width: 960px;
          margin: 0 auto;
          padding: 14px 20px 26px;
          color: #9a927e;
          font-size: 15.6px;
        }
        @media (max-width: 600px) {
          .aulrtm h1.aulrtm-title {
            font-size: 24.7px;
          }
          .aulrtm .aulrtm-detail {
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

function DetailPanel({ entry, onClose }: { entry: HenreiEntry; onClose: () => void }) {
  const brief = isBrief(entry);

  return (
    <div className="aulrtm-detail">
      <div className="aulrtm-detail-head">
        <div className="aulrtm-detail-code-row">
          {entry.code ? (
            <span className={`aulrtm-code${brief ? " aulrtm-brief" : ""}`}>{entry.code}</span>
          ) : (
            <span className="aulrtm-code aulrtm-msg">メッセージ返戻</span>
          )}
          {brief ? <span className="aulrtm-badge-brief">簡易版</span> : null}
        </div>
        <button className="aulrtm-closebtn" aria-label="閉じる" type="button" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="aulrtm-detail-title">{entry.title}</div>

      {brief ? (
        <>
          <div className="aulrtm-detail-pages">エラーコード一覧（令和7年9月以降審査分） No.{entry.no}</div>
          <div className="aulrtm-plain">{entry.title}</div>
          {entry.retname ? (
            <div className="aulrtm-plain" style={{ marginTop: 6, color: "#7a7460", fontSize: 16.9 }}>
              （返戻事由名：{entry.retname}）
            </div>
          ) : null}
          {entry.flag === "○" ? (
            <div className="aulrtm-plain" style={{ marginTop: 6, color: "#7a7460", fontSize: 16.9 }}>
              事前チェック適用あり
            </div>
          ) : null}
          <div className="aulrtm-brief-note">
            簡易版収録のため、原因・対応方法の詳しい解説はまだありません。マニュアルへの追記があり次第、更新予定です。
          </div>
        </>
      ) : (
        <>
          <div className="aulrtm-detail-pages">原本 {(entry.pages ?? []).map((page) => `p.${page}`).join(", ")}</div>
          {parseContent(entry.content ?? "").map((block, index) => {
            if (block.type === "section") {
              return (
                <div className="aulrtm-section" key={index}>
                  <h3>{block.label}</h3>
                  <div className="aulrtm-body">{block.text}</div>
                </div>
              );
            }
            if (block.type === "continuation") {
              return (
                <div className="aulrtm-plain" style={{ color: "#9a927e", fontSize: 15.6, marginTop: 6 }} key={index}>
                  {block.text}
                </div>
              );
            }
            return (
              <div className="aulrtm-plain" key={index}>
                {block.text}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
