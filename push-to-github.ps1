# GitHub 上传脚本
# 使用方法：在 PowerShell 中运行此脚本，按照提示输入信息

Write-Host "=== GitHub 上传脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 获取仓库 URL
$repoUrl = Read-Host "请输入 GitHub 仓库 URL (例如: https://github.com/用户名/仓库名.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "错误: 仓库 URL 不能为空" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "正在添加远程仓库..." -ForegroundColor Yellow
git remote add origin $repoUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "远程仓库可能已存在，尝试更新..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

Write-Host ""
Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow
Write-Host "提示: 如果提示输入用户名和密码，请使用 GitHub Personal Access Token 作为密码" -ForegroundColor Cyan
Write-Host ""

# 尝试推送到 main 分支
git branch -M main 2>$null
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    # 如果 main 失败，尝试 master
    Write-Host "尝试推送到 master 分支..." -ForegroundColor Yellow
    git push -u origin master
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 代码已成功上传到 GitHub！" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ 上传失败，请检查：" -ForegroundColor Red
    Write-Host "1. 仓库 URL 是否正确" -ForegroundColor Yellow
    Write-Host "2. 是否有仓库访问权限" -ForegroundColor Yellow
    Write-Host "3. 是否配置了 GitHub 认证（用户名/密码或 Personal Access Token）" -ForegroundColor Yellow
}
