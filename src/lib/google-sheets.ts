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

async function batchUpdate(requests: object[]): Promise<void> {
  const config = getConfig();
  const accessToken = await getAccessToken(config);

  const response = await fetch(`${SHEETS_API}/${config.sheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`スプレッドシートの更新に失敗しました（HTTP ${response.status}）。${detail.slice(0, 300)}`);
  }
}

/** シート名から、batchUpdate 等で使う内部シートID（gid）を取得する。 */
async function getSheetIdByTitle(range: string): Promise<number> {
  const config = getConfig();
  const accessToken = await getAccessToken(config);

  const response = await fetch(`${SHEETS_API}/${config.sheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`スプレッドシートの情報取得に失敗しました（HTTP ${response.status}）。${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    sheets?: { properties?: { sheetId?: number; title?: string } }[];
  };
  const sheet = data.sheets?.find((s) => s.properties?.title === range);
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`シート「${range}」が見つかりませんでした。`);
  }

  return sheet.properties.sheetId;
}

/**
 * シート全体の入力規則（ドロップダウン設定）をクリアする。
 *
 * 列の追加・並べ替えは値の上書き（values.update）だけでは行内容しか動かず、
 * 入力規則は元の物理的な列位置に残り続けてしまう。手動で設定した古い
 * ドロップダウンが、列がずれた後に別の列（例: titleなど）へ残留して混乱を
 * 招くのを防ぐため、列を書き出すたびに一旦すべてクリアしてから、
 * 必要な列にだけ setColumnDropdown で設定し直す。
 */
export async function clearAllDataValidation(
  options: { range?: string; startRow?: number; endRow?: number; endColumn?: number } = {},
): Promise<void> {
  const range = options.range ?? DEFAULT_RANGE;
  const sheetId = await getSheetIdByTitle(range);

  await batchUpdate([
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: options.startRow ?? 0,
          endRowIndex: options.endRow ?? 2000,
          startColumnIndex: 0,
          endColumnIndex: options.endColumn ?? 26,
        },
        // rule を省略すると、その範囲の入力規則がクリアされる。
      },
    },
  ]);
}

/**
 * 指定した列（0始まり）にドロップダウン（選択式）の入力規則を設定する。
 * 既存の規則があれば上書きする。
 */
export async function setColumnDropdown(
  columnIndex: number,
  choices: string[],
  options: { range?: string; startRow?: number; endRow?: number } = {},
): Promise<void> {
  const range = options.range ?? DEFAULT_RANGE;
  const sheetId = await getSheetIdByTitle(range);

  await batchUpdate([
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: options.startRow ?? 1, // ヘッダー行(0)は除く
          endRowIndex: options.endRow ?? 2000,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 1,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: choices.map((value) => ({ userEnteredValue: value })),
          },
          strict: true,
          showCustomUi: true,
        },
      },
    },
  ]);
}
