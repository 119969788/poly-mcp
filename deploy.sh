#!/bin/bash

# Polymarket 跟单套利程序部署脚本
# 适用于 Ubuntu/Debian 系统

set -e  # 遇到错误立即退出

echo "=== Polymarket 跟单套利程序部署脚本 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}请不要使用 root 用户运行此脚本${NC}"
   exit 1
fi

# 检查 Node.js
echo -e "${YELLOW}检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，正在安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}Node.js 已安装: $NODE_VERSION${NC}"
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm 未安装${NC}"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}npm 已安装: $NPM_VERSION${NC}"
fi

# 检查 Git
echo -e "${YELLOW}检查 Git...${NC}"
if ! command -v git &> /dev/null; then
    echo "Git 未安装，正在安装..."
    sudo apt-get update
    sudo apt-get install -y git
else
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}Git 已安装: $GIT_VERSION${NC}"
fi

# 项目目录
PROJECT_DIR="$HOME/poly-mcp"

# 检查项目是否已存在
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录已存在: $PROJECT_DIR${NC}"
    read -p "是否要更新现有项目? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_DIR"
        echo "正在拉取最新代码..."
        git pull
    else
        echo "跳过更新"
    fi
else
    echo "正在克隆项目..."
    git clone https://github.com/119969788/poly-mcp.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 安装依赖
echo -e "${YELLOW}正在安装依赖...${NC}"
npm install

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}创建 .env 文件...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env 文件已创建，请编辑配置文件:${NC}"
    echo "  nano $PROJECT_DIR/.env"
    echo ""
    echo -e "${YELLOW}⚠️  请先配置 .env 文件后再启动应用${NC}"
else
    echo -e "${GREEN}.env 文件已存在${NC}"
fi

# 安装 PM2
echo -e "${YELLOW}检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 PM2..."
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 已安装${NC}"
else
    echo -e "${GREEN}PM2 已安装${NC}"
fi

# 设置文件权限
chmod 600 .env 2>/dev/null || true

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "下一步操作:"
echo "1. 编辑配置文件:"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "2. 启动应用:"
echo "   cd $PROJECT_DIR"
echo "   pm2 start src/index.js --name poly-mcp-arbitrage"
echo ""
echo "3. 查看状态:"
echo "   pm2 status"
echo ""
echo "4. 查看日志:"
echo "   pm2 logs poly-mcp-arbitrage"
echo ""
echo "5. 设置开机自启:"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
