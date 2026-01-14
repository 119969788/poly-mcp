#!/bin/bash

# 腾讯云服务器一键安装脚本
# Polymarket 跟单套利程序

set -e

echo "=========================================="
echo "Polymarket 跟单套利程序 - 腾讯云安装脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}检测到使用 root 用户${NC}"
   echo -e "${YELLOW}建议: 使用普通用户运行以提高安全性${NC}"
   read -p "是否继续使用 root 用户? (y/n) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       echo "已取消"
       exit 1
   fi
fi

# 步骤 1: 更新系统
echo -e "${YELLOW}[1/8] 更新系统包...${NC}"
sudo apt update
sudo apt upgrade -y

# 步骤 2: 检查 Node.js
echo -e "${YELLOW}[2/8] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，正在安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}Node.js 已安装: $NODE_VERSION${NC}"
    
    # 检查版本是否 >= 16
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 16 ]; then
        echo -e "${RED}Node.js 版本过低，需要升级到 18.x${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION, npm: $NPM_VERSION${NC}"

# 步骤 3: 检查 Git
echo -e "${YELLOW}[3/8] 检查 Git...${NC}"
if ! command -v git &> /dev/null; then
    echo "Git 未安装，正在安装..."
    sudo apt-get install -y git
else
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}Git 已安装: $GIT_VERSION${NC}"
fi

# 步骤 4: 克隆项目
echo -e "${YELLOW}[4/8] 克隆项目...${NC}"
PROJECT_DIR="$HOME/poly-mcp"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录已存在: $PROJECT_DIR${NC}"
    read -p "是否要更新现有项目? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_DIR"
        echo "正在拉取最新代码..."
        git pull
    else
        echo "跳过更新，使用现有项目"
    fi
else
    echo "正在克隆项目..."
    git clone https://github.com/119969788/poly-mcp.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 步骤 5: 安装依赖
echo -e "${YELLOW}[5/8] 安装项目依赖...${NC}"
cd "$PROJECT_DIR"
npm install

# 步骤 6: 配置环境变量
echo -e "${YELLOW}[6/8] 配置环境变量...${NC}"
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo -e "${GREEN}.env 文件已创建${NC}"
    echo -e "${YELLOW}⚠️  请编辑 .env 文件设置 PRIVATE_KEY${NC}"
    echo "   运行: nano $PROJECT_DIR/.env"
else
    echo -e "${GREEN}.env 文件已存在${NC}"
fi

# 步骤 7: 安装 PM2
echo -e "${YELLOW}[7/8] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 PM2..."
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 已安装${NC}"
else
    echo -e "${GREEN}PM2 已安装${NC}"
fi

# 步骤 8: 设置文件权限
echo -e "${YELLOW}[8/8] 设置文件权限...${NC}"
chmod 600 .env 2>/dev/null || true

echo ""
echo -e "${GREEN}=========================================="
echo "✅ 安装完成！"
echo "==========================================${NC}"
echo ""
echo "下一步操作:"
echo "1. 编辑配置文件:"
echo "   nano $PROJECT_DIR/.env"
echo "   至少设置: PRIVATE_KEY=0x你的私钥"
echo ""
echo "2. 生成 API 凭证:"
echo "   cd $PROJECT_DIR"
echo "   npm run generate-api"
echo ""
echo "3. 将生成的 API 凭证添加到 .env 文件"
echo ""
echo "4. 启动应用:"
echo "   cd $PROJECT_DIR"
echo "   pm2 start src/index.js --name poly-mcp-arbitrage"
echo ""
echo "5. 查看状态:"
echo "   pm2 status"
echo ""
echo "6. 查看日志:"
echo "   pm2 logs poly-mcp-arbitrage"
echo ""
echo "7. 设置开机自启:"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
