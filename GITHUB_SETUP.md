# GitHub 上传指南

本地代码已提交到 git 仓库。按照以下步骤将代码上传到 GitHub：

## 方法一：使用 GitHub CLI（推荐）

如果你已安装 GitHub CLI (`gh`)，可以使用以下命令：

```bash
# 1. 登录 GitHub
gh auth login

# 2. 创建仓库并推送（仓库设为公开）
gh repo create poly-mcp-arbitrage --public --source=. --remote=origin --push

# 或者创建私有仓库
gh repo create poly-mcp-arbitrage --private --source=. --remote=origin --push
```

## 方法二：通过 GitHub 网站（推荐新用户）

### 步骤 1：创建 GitHub 仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 **"+"** 按钮，选择 **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `poly-mcp-arbitrage`（或其他名称）
   - **Description**: `Polymarket 跟单套利程序`
   - 选择 **Public** 或 **Private**
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
4. 点击 **"Create repository"**

### 步骤 2：连接远程仓库并推送

在 GitHub 创建仓库后，会显示推送现有仓库的说明。执行以下命令：

```bash
# 添加远程仓库（将 YOUR_USERNAME 替换为你的 GitHub 用户名，REPO_NAME 替换为仓库名）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 或者使用 SSH（如果你已配置 SSH 密钥）
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

**注意**：如果你的仓库默认分支是 `master` 而不是 `main`，使用：

```bash
git push -u origin master
```

## 方法三：使用 SSH 密钥（更安全）

如果你还没有配置 SSH 密钥，可以参考以下步骤：

### 1. 生成 SSH 密钥（如果还没有）

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. 添加 SSH 密钥到 GitHub

1. 复制公钥内容：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

2. 在 GitHub 上：
   - 点击头像 → **Settings**
   - 左侧菜单选择 **SSH and GPG keys**
   - 点击 **New SSH key**
   - 粘贴公钥内容并保存

3. 测试连接：
   ```bash
   ssh -T git@github.com
   ```

### 3. 使用 SSH URL 添加远程仓库

```bash
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

## 验证上传

推送成功后，访问你的 GitHub 仓库页面，应该能看到所有代码文件。

## 后续操作

推送代码后，你可以：

1. **添加项目描述和标签**：在 GitHub 仓库页面点击 ⚙️ Settings，添加描述和主题标签
2. **添加 LICENSE**：如果需要，可以添加 MIT 或其他许可证
3. **设置 GitHub Actions**：可以配置 CI/CD 流程
4. **创建 Release**：当代码稳定后，可以创建发布版本

## 常用 Git 命令

```bash
# 查看远程仓库
git remote -v

# 查看提交历史
git log --oneline

# 查看状态
git status

# 添加文件
git add .

# 提交更改
git commit -m "提交信息"

# 推送到 GitHub
git push

# 拉取最新更改
git pull
```

## 注意事项

- ⚠️ **不要提交 `.env` 文件**：`.env` 文件已在 `.gitignore` 中，确保不要将敏感信息提交到 GitHub
- ✅ **可以提交 `.env.example`**：这是一个模板文件，不包含敏感信息
- 🔒 **保护敏感信息**：确保 API 密钥、私钥等敏感信息不会被提交
- 📝 **提交信息要清晰**：使用有意义的提交信息，方便后续追踪

## 问题排查

### 如果推送时要求输入用户名和密码

1. 使用 Personal Access Token 代替密码
2. 或者配置 SSH 密钥
3. 或者使用 GitHub CLI

### 如果远程仓库已存在内容

```bash
# 拉取远程内容并合并
git pull origin main --allow-unrelated-histories

# 解决冲突后推送
git push -u origin main
```

### 如果分支名称不匹配

```bash
# 重命名本地分支
git branch -M main

# 或者使用远程分支名称
git push -u origin master
```
