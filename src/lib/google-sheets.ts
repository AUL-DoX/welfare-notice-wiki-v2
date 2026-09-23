/**
 * 最小限の Google Sheets API クライアント（OAuthリフレッシュトークン方式）。
 *
 * 組織のポリシーでサービスアカウントの鍵作成がブロックされていたため、
 * 管理者本人のGoogleアカウントでOAuth認可した際のリフレッシュトークンを使う。
 * このモジュールはローカルのスクリプト（scripts/export-to-sheet.ts,
 * scripts/sync-from-sheet.ts）からのみ使う想定で、本番Vercelには
 * 認証情報を置かない。
 *
 * 必要な環境変数（.env.local）:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 *   GOOGLE_SHEET_ID
 */

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_RANGE = "シート1";

type GoogleSheetsConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sheetId: string;
};

function getConfig(): GoogleSheetsConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientId || !clientSecret || !refreshToken || !sheetId) {
    throw new Error(
      "Google Sheets 連携が設定されていません（.env.local に GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN / GOOGLE_SHEET_ID が必要です）。",
    );
  }

  return { clientId, clientSecret, refreshToken, sheetId };
}

async function getAccessToken(config: GoogleSheetsConfig): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`アクセストークンの取得に失敗しました（HTTP ${response.status}）。${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("アクセストークンの取得結果が不正です。");
  }

  return data.access_token;
}

/** シートの指定範囲を2次元配列（1行目はヘッダー想定）で取得する。 */
export async function readSheetRows(range: string = DEFAULT_RANGE): Promise<string[][]> {
  const config = getConfig();
  const accessToken = await getAccessToken(config);

  const response = await fetch(`${SHEETS_API}/${config.sheetId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`スプレッドシートの読み込みに失敗しました（HTTP ${response.status}）。${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

/** シートの指定範囲を丸ごと上書きする。 */
export async function writeSheetRows(rows: string[][], range: string = DEFAULT_RANGE): Promise<void> {
  const config = getConfig();
  const accessToken = await getAccessToken(config);

  const response = await fetch(
    `${SHEETS_API}/${config.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`スプレッドシートへの書き込みに失敗しました（HTTP ${response.status}）。${detail.slice(0, 300)}`);
  }
}
