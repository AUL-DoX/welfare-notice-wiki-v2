@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================
echo  スプレッドシートの変更内容を確認しています...
echo ===============================================
echo.

call npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/sync-from-sheet.ts
if errorlevel 1 (
    echo.
    echo エラーが発生しました。上の内容を確認してください。
    pause
    exit /b 1
)

echo.
set /p CONFIRM=この内容を本番サイトに反映しますか？ (y/N):

if /i not "%CONFIRM%"=="y" (
    echo キャンセルしました。
    pause
    exit /b 0
)

echo.
echo ===============================================
echo  反映しています...
echo ===============================================
echo.

call npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/sync-from-sheet.ts --apply
if errorlevel 1 (
    echo.
    echo エラーが発生しました。上の内容を確認してください。
    pause
    exit /b 1
)

echo.
echo 完了しました。1〜2分ほどで本番サイトに反映されます。
pause

