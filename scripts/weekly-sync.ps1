# 週次監視 → 取り込み → 保存 → push を自動でまとめて実行する。
# Windowsのタスクスケジューラ「福祉サイト週次監視」から呼び出される想定。
#
# 手順:
#   1. monitor_sites.py を実行（サイト巡回・レポート生成・メール送信）
#   2. リポジトリを最新化（Obsidianの自動pushとの競合に備えてstash→rebase→pop）
#   3. 今日分のレポートを ingest-watch-links.ts で取り込み
#   4. ダウンロード可能なリンクを bulk-promote-watch-links.ts で保存
#   5. push（Obsidianが割り込んでいた場合は一度だけ再試行）

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$MonitorScript = "C:\Users\fabul\OneDrive\デスクトップ\claude-wiki\monitor_sites.py"
$ReportDir = "C:\Users\fabul\OneDrive\デスクトップ\admin-wiki\raw"
$LogFile = Join-Path $RepoRoot "weekly-sync.log"

function Write-Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Sync-WithRemote {
    $dirty = git status --porcelain
    $stashed = $false
    if ($dirty) {
        git stash push -u -m "weekly-sync auto-stash" | Out-Null
        $stashed = $true
    }

    git fetch origin main | Out-Null
    git rebase origin/main

    if ($stashed) {
        git stash pop | Out-Null
    }
}

try {
    Set-Location $RepoRoot
    Write-Log "=== 週次同期を開始 ==="

    Write-Log "monitor_sites.py を実行..."
    python $MonitorScript
    if ($LASTEXITCODE -ne 0) {
        throw "monitor_sites.py が失敗しました (exit $LASTEXITCODE)"
    }

    Write-Log "リポジトリを最新化..."
    Sync-WithRemote

    $today = Get-Date -Format "yyyy-MM-dd"
    $reportPath = Join-Path $ReportDir "監視レポート_$today.md"

    if (-not (Test-Path $reportPath)) {
        Write-Log "レポートファイルが見つかりません（新着なしの可能性）: $reportPath"
        Write-Log "=== 週次同期を終了（取り込みなし） ==="
        exit 0
    }

    Write-Log "watch-links.json へ取り込み中: $reportPath"
    npx tsx scripts/ingest-watch-links.ts $reportPath
    if ($LASTEXITCODE -ne 0) {
        throw "ingest-watch-links.ts が失敗しました"
    }

    Write-Log "ダウンロード可能なリンクを保存中..."
    npx tsx scripts/bulk-promote-watch-links.ts
    if ($LASTEXITCODE -ne 0) {
        throw "bulk-promote-watch-links.ts が失敗しました"
    }

    Write-Log "push中..."
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Log "push が拒否されたため、再同期して再試行します。"
        Sync-WithRemote
        git push
        if ($LASTEXITCODE -ne 0) {
            throw "push に失敗しました（再試行後も失敗）"
        }
    }

    Write-Log "=== 週次同期が完了しました ==="
}
catch {
    Write-Log "エラー: $($_.Exception.Message)"
    exit 1
}

