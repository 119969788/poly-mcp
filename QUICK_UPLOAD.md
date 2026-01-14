# 快速上传指南

## 方法一：使用脚本（推荐）

1. **创建 GitHub 仓库**（如果还没有）：
   - 访问：https://github.com/new
   - 填写仓库名称，创建仓库

2. **运行上传脚本**：
   ```powershell
   .\push-to-github.ps1
   ```
   然后按照提示输入仓库 URL

## 方法二：手动命令

如果你已经创建了 GitHub 仓库，执行以下命令（替换 YOUR_USERNAME 和 REPO_NAME）：

```powershell
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

如果默认分支是 `master`，使用：
```powershell
git push -u origin master
```

## 认证说明

推送时可能需要输入：
- **用户名**: 你的 GitHub 用户名
- **密码**: 使用 GitHub Personal Access Token（不是账户密码）

### 如何创建 Personal Access Token：

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置名称和过期时间
4. 勾选 `repo` 权限
5. 点击 "Generate token"
6. 复制 token（只显示一次）

推送时，密码输入框使用这个 token。

## 如果遇到问题

- **仓库已存在错误**: 使用 `git remote set-url origin <URL>` 更新 URL
- **认证失败**: 检查用户名和 token 是否正确
- **分支不匹配**: 确认远程仓库的默认分支名（main 或 master）
