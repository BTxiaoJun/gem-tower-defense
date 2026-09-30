@echo off
chcp 65001 >nul
cd /d %~dp0

git remote get-url github >nul 2>&1
if errorlevel 1 (
    echo [!] 还没绑定 GitHub 远程仓库，请先看 README.md 的"首次配置"。
    pause
    exit /b 1
)
git remote get-url gitee >nul 2>&1
if errorlevel 1 (
    echo [!] 还没绑定 Gitee 远程仓库，请先看 README.md 的"首次配置"。
    pause
    exit /b 1
)

echo === 推送到 GitHub ===
git push github main
echo.
echo === 推送到 Gitee ===
git push gitee main
echo.
echo 完成！如果上面有红色报错，把报错文字复制给 AI 看即可。
pause
