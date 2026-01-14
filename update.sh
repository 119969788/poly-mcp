#!/bin/bash

# 服务器更新脚本
# 用于快速更新代码并重启应用

set -e

echo "=== 更新 Polymarket 跟单套利程序 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目目录（可以根据实际情况修改）
PROJECT_DIR="$HOME/poly-mcp"

# 如果指定了路径，使用指定路径
if [ ! -z "$1" ]; then
    PROJECT_DIR="$1"
fi

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}错误: 项目目录不存在: $PROJECT_DIR${NC}"
    echo "使用方法: ./update.sh [项目路径]"
    exit 1
fi

cd "$PROJECT_DIR"

# 显示当前状态
echo -e "${YELLOW}项目目录: $PROJECT_DIR${NC}"
echo -e "${YELLOW}当前分支: $(git branch --show-current)${NC}"
echo ""

# 备份 .env 文件（如果存在）
if [ -f .env ]; then
    echo "备份 .env 文件..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# 拉取最新代码
echo -e "${YELLOW}正在拉取最新代码...${NC}"
git fetch origin

# 检查是否有更新
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}代码已是最新版本${NC}"
else
    echo "发现更新，正在拉取..."
    git pull origin main || git pull origin master
    echo -e "${GREEN}代码更新完成${NC}"
fi

# 安装新依赖
echo ""
echo -e "${YELLOW}正在检查依赖...${NC}"
npm install

# 重启应用
echo ""
echo -e "${YELLOW}正在重启应用...${NC}"

# 检查使用 PM2 还是 systemd
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "poly-mcp-arbitrage"; then
        pm2 restart poly-mcp-arbitrage
        echo -e "${GREEN}✅ PM2 应用已重启${NC}"
        echo ""
        pm2 status
    else
        echo -e "${YELLOW}⚠️  PM2 应用未运行${NC}"
        echo "可以运行: pm2 start src/index.js --name poly-mcp-arbitrage"
    fi
elif systemctl list-units --type=service | grep -q "poly-mcp.service"; then
    if systemctl is-active --quiet poly-mcp; then
        sudo systemctl restart poly-mcp
        echo -e "${GREEN}✅ systemd 服务已重启${NC}"
        echo ""
        sudo systemctl status poly-mcp --no-pager
    else
        echo -e "${YELLOW}⚠️  systemd 服务未运行${NC}"
        echo "可以运行: sudo systemctl start poly-mcp"
    fi
else
    echo -e "${YELLOW}⚠️  未检测到运行中的应用${NC}"
    echo "请手动启动应用"
fi

echo ""
echo -e "${GREEN}=== 更新完成 ===${NC}"
echo ""
echo "提示:"
echo "  - 查看日志: pm2 logs poly-mcp-arbitrage"
echo "  - 查看状态: pm2 status"
echo "  - 如果遇到问题，检查 .env 文件配置"
