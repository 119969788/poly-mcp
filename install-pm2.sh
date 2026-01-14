#!/bin/bash

# PM2 安装和配置脚本

set -e

echo "=== PM2 安装脚本 ==="
echo ""

PROJECT_DIR="$HOME/poly-mcp"
APP_NAME="poly-mcp-arbitrage"

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误: 项目目录不存在: $PROJECT_DIR"
    echo "请先运行 deploy.sh 或克隆项目"
    exit 1
fi

cd "$PROJECT_DIR"

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 PM2..."
    sudo npm install -g pm2
else
    echo "PM2 已安装"
fi

# 检查是否已在运行
if pm2 list | grep -q "$APP_NAME"; then
    echo "应用已在运行，正在重启..."
    pm2 restart "$APP_NAME"
else
    echo "启动应用..."
    pm2 start src/index.js --name "$APP_NAME"
fi

# 显示状态
echo ""
echo "应用状态:"
pm2 status

# 设置开机自启
echo ""
echo "设置开机自启..."
pm2 startup
echo "请运行上面显示的命令（需要 root 权限）"
echo "然后运行: pm2 save"

echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs $APP_NAME"
echo "  查看状态: pm2 status"
echo "  重启: pm2 restart $APP_NAME"
echo "  停止: pm2 stop $APP_NAME"
echo "  监控: pm2 monit"
