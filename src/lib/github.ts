/**
 * 最小限の GitHub Contents API クライアント。
 *
 * Vercel 本番ではファイルシステムが読み取り専用のため、管理画面からの
 * カテゴリ変更はローカルファイルへ書き込めない。代わりに、この関数群で
 * 小さな設定ファイル（data/document-categories.json）を GitHub へ直接
 * コミットし、Vercel の自動デプロイで本番へ反映させる。
 *
 * 必要な環境変数（Vercel のプロジェクト設定に登録する）:
 *   GITHUB_TOKEN  … contents:write 権限を持つ Personal Access Token
 *   GITHUB_REPO   … "owner/repo"（未設定なら既定値を使用）
 *   GITHUB_BRANCH … 対象ブランチ（未設定なら "main"）
 */

const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "AUL-DoX/welfare-notice-wiki-v2";
const DEFAULT_BRANCH = "main";

export type GithubConfig = {
  token: string;
  repo: string;
  branch: string;
};

export function getGithubConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return null;
  }

  return {
    token,
    repo: process.env.GITHUB_REPO ?? DEFAULT_REPO,
    branch: process.env.GITHUB_BRANCH ?? DEFAULT_BRANCH,
  };
}

export function isGithubConfigured(): boolean {
  return getGithubConfig() !== null;
}

type RepoFile = {
  content: string;
  sha: string;
};

function encodeRepoPath(filePath: string): string {
  return filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function githubFetch(config: GithubConfig, apiPath: string, init?: RequestInit) {
  return fetch(`${GITHUB_API}${apiPath}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "welfare-notice-wiki-admin",
      ...(init?.headers ?? {}),
    },
  });
}

async function getRepoFile(config: GithubConfig, filePath: string): Promise<RepoFile | null> {
  const response = await githubFetch(
    config,
    `/repos/${config.repo}/contents/${encodeRepoPath(filePath)}?ref=${encodeURIComponent(config.branch)}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub からファイルを取得できませんでした（HTTP ${response.status}）。`);
  }

  const data = (await response.json()) as { content?: string; encoding?: string; sha?: string };
  if (typeof data.sha !== "string") {
    throw new Error("GitHub のレスポンス形式が想定と異なります。");
  }

  const content = typeof data.content === "string" ? Buffer.from(data.content, "base64").toString("utf8") : "";
  return { content, sha: data.sha };
}

async function putRepoFile(
  config: GithubConfig,
  filePath: string,
  content: string,
  message: string,
  sha: string | undefined,
) {
  const response = await githubFetch(config, `/repos/${config.repo}/contents/${encodeRepoPath(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  return response;
}

const MAX_COMMIT_ATTEMPTS = 5;

/**
 * data/document-categories.json に複数件のカテゴリ上書きをまとめて GitHub へ
 * コミットする（1 回の PUT = 1 コミット = 1 回のデプロイ）。管理画面で
 * 何件も連続して分類する場合に、1 件ずつ個別コミットすると sha 競合
 * （HTTP 409）や無駄なデプロイの連発を招くため、呼び出し側で変更をまとめてから
 * 一括で渡すこと。ファイルの取得と書き込みの間に別の変更が割り込んだ場合は、
 * 最新の sha を取り直して複数回（バックオフ付き）再試行する。
 */
export async function commitJsonMapEntries(
  filePath: string,
  entries: Record<string, string>,
  commitMessage: string,
): Promise<void> {
  const config = getGithubConfig();
  if (!config) {
    throw new Error("GitHub 連携が設定されていません（GITHUB_TOKEN 未設定）。");
  }

  for (let attempt = 0; attempt < MAX_COMMIT_ATTEMPTS; attempt += 1) {
    const existing = await getRepoFile(config, filePath);
    const map = parseJsonMap(existing?.content);
    Object.assign(map, entries);
    const nextContent = `${JSON.stringify(map, null, 2)}\n`;

    const response = await putRepoFile(config, filePath, nextContent, commitMessage, existing?.sha);
    if (response.ok) {
      return;
    }

    // 409 = sha 競合。少し待ってから最新の sha を取り直して再試行する。
    if (response.status === 409 && attempt < MAX_COMMIT_ATTEMPTS - 1) {
      await sleep(150 + Math.random() * 250);
      continue;
    }

    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub へのコミットに失敗しました（HTTP ${response.status}）。${detail.slice(0, 200)}`);
  }
}

export async function commitJsonMapEntry(
  filePath: string,
  key: string,
  value: string,
  commitMessage: string,
): Promise<void> {
  return commitJsonMapEntries(filePath, { [key]: value }, commitMessage);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonMap(raw: string | undefined): Record<string, string> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    }
  } catch {
    // 壊れた JSON は空マップとして扱い、上書きで復旧させる。
  }

  return {};
}
