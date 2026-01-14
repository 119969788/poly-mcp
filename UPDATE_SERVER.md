# 服务器更新指南

当代码更新后，需要在服务器上拉取最新代码并重启应用。

## 快速更新步骤

### 如果使用 Git 克隆的项目

```bash
# 1. 进入项目目录
cd ~/poly-mcp
# 或者你的项目路径
cd /var/www/poly-mcp

# 2. 拉取最新代码
git pull

# 3. 安装新依赖（如果有）
npm install

# 4. 重启应用

# 如果使用 PM2
pm2 restart poly-mcp-arbitrage

# 如果使用 systemd
sudo systemctl restart poly-mcp
```

### 一键更新脚本

也可以使用提供的更新脚本：

```bash
cd ~/poly-mcp
chmod +x update.sh
./update.sh
```

## 详细步骤

### 1. 连接到服务器

```bash
ssh username@your-server-ip
```

### 2. 进入项目目录

```bash
cd ~/poly-mcp
# 或者
cd /var/www/poly-mcp
```

### 3. 检查当前状态

```bash
# 查看当前分支和状态
git status

# 查看最近的提交
git log --oneline -5
```

### 4. 拉取最新代码

```bash
# 拉取最新代码
git pull origin main

# 或者如果默认分支是 master
git pull origin master
```

### 5. 安装新依赖

如果有新的依赖包添加：

```bash
npm install
```

### 6. 检查配置文件

如果 `.env.example` 有更新，检查 `.env` 文件是否需要更新：

```bash
# 查看 .env.example 的变化（可选）
git diff HEAD~1 .env.example

# 如果需要，手动更新 .env 文件
nano .env
```

### 7. 重启应用

#### 使用 PM2

```bash
# 重启应用
pm2 restart poly-mcp-arbitrage

# 查看状态
pm2 status

# 查看日志
pm2 logs poly-mcp-arbitrage --lines 50
```

#### 使用 systemd

```bash
# 重启服务
sudo systemctl restart poly-mcp

# 查看状态
sudo systemctl status poly-mcp

# 查看日志
sudo journalctl -u poly-mcp -n 50 -f
```

## 更新脚本（自动更新）

创建一个更新脚本 `update.sh`：

```bash
#!/bin/bash

set -e

echo "=== 更新 Polymarket 跟单套利程序 ==="

# 项目目录
PROJECT_DIR="$HOME/poly-mcp"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误: 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# 拉取最新代码
echo "正在拉取最新代码..."
git pull

# 安装新依赖
echo "正在安装依赖..."
npm install

# 重启应用
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "poly-mcp-arbitrage"; then
        echo "正在重启 PM2 应用..."
        pm2 restart poly-mcp-arbitrage
        echo "✅ 应用已重启"
        pm2 status
    else
        echo "⚠️  PM2 应用未运行"
    fi
elif systemctl is-active --quiet poly-mcp; then
    echo "正在重启 systemd 服务..."
    sudo systemctl restart poly-mcp
    echo "✅ 服务已重启"
    sudo systemctl status poly-mcp
else
    echo "⚠️  未检测到运行中的应用"
    echo "请手动启动应用"
fi

echo ""
echo "✅ 更新完成！"
```

## 回滚到之前的版本

如果更新后出现问题，可以回滚：

```bash
# 查看提交历史
git log --oneline

# 回滚到之前的提交（替换 COMMIT_HASH 为提交 ID）
git reset --hard COMMIT_HASH

# 重启应用
pm2 restart poly-mcp-arbitrage
# 或
sudo systemctl restart poly-mcp
```

## 更新前备份

建议更新前备份重要文件：

```bash
# 备份 .env 文件
cp .env .env.backup

# 备份整个项目（可选）
tar -czf poly-mcp-backup-$(date +%Y%m%d).tar.gz ~/poly-mcp
```

## 常见问题

### Q: 更新后应用无法启动？

```bash
# 查看日志
pm2 logs poly-mcp-arbitrage
# 或
sudo journalctl -u poly-mcp -n 100

# 检查配置文件
cat .env

# 检查依赖是否安装
npm list
```

### Q: Git pull 出现冲突？

```bash
# 查看冲突
git status

# 如果需要放弃本地更改，使用
git reset --hard origin/main

# 或手动解决冲突
git mergetool
```

### Q: 更新后需要重新配置？

如果配置文件有变化，需要：

```bash
# 查看 .env.example 的变化
git diff HEAD~1 .env.example

# 手动更新 .env 文件
nano .env
```

## 自动化更新（可选）

可以设置定时任务自动更新（不推荐用于生产环境）：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 3 点更新）
0 3 * * * cd ~/poly-mcp && git pull && npm install && pm2 restart poly-mcp-arbitrage
```
