# 腾讯云服务器完整安装指南

本指南将帮助你在腾讯云空白服务器上从零开始安装和配置 Polymarket 跟单套利程序。

## 前置要求

- 腾讯云服务器（Ubuntu 20.04/22.04 推荐）
- SSH 访问权限
- root 或 sudo 权限

## 完整安装步骤

### 步骤 1: 连接到服务器

使用 SSH 连接到你的腾讯云服务器：

```bash
ssh root@your-server-ip
# 或
ssh ubuntu@your-server-ip
```

**提示**: 如果是首次连接，可能需要接受主机密钥。

### 步骤 2: 更新系统包

```bash
# 更新包列表
sudo apt update

# 升级系统包（可选，但推荐）
sudo apt upgrade -y
```

### 步骤 3: 安装 Node.js 18.x

```bash
# 安装 Node.js 18.x（推荐版本）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v18.x.x 或更高
npm --version   # 应该显示 9.x.x 或更高
```

**如果遇到网络问题**，可以使用国内镜像：

```bash
# 使用淘宝镜像（如果官方源慢）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# 或者使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 步骤 4: 安装 Git

```bash
# 安装 Git
sudo apt install -y git

# 验证安装
git --version
```

### 步骤 5: 配置 Git（可选但推荐）

```bash
# 配置 Git 用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 步骤 6: 克隆项目

```bash
# 进入 home 目录
cd ~

# 克隆项目
git clone https://github.com/119969788/poly-mcp.git

# 进入项目目录
cd poly-mcp

# 验证克隆成功
ls -la
# 应该能看到 package.json, src/, README.md 等文件
```

### 步骤 7: 安装项目依赖

```bash
# 确保在项目目录中
cd ~/poly-mcp

# 安装依赖（可能需要几分钟）
npm install

# 如果安装慢，可以使用国内镜像
# npm install --registry=https://registry.npmmirror.com
```

**如果遇到依赖安装问题**：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 步骤 8: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
# 或使用 vi
vi .env
```

**最小配置**（必须设置）：

```env
# 私钥（必需）
PRIVATE_KEY=0x你的私钥

# Polymarket 服务器配置
POLYMARKET_HOST=https://clob.polymarket.com
CHAIN_ID=137

# 签名类型和资金地址
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址
```

**完整配置示例**：

```env
# Polymarket API 配置
# 1. 首先设置私钥
PRIVATE_KEY=0x你的私钥

# 2. 运行 npm run generate-api 生成以下 API 凭证
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_SECRET=your_api_secret_here
POLYMARKET_API_PASSPHRASE=your_api_passphrase_here

# Polymarket 服务器配置
POLYMARKET_HOST=https://clob.polymarket.com
CHAIN_ID=137

# 签名类型配置 (0=EOA, 1=POLY_PROXY, 2=GNOSIS_SAFE)
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址

# MCP 服务器端点（可选）
MCP_ENDPOINT=http://localhost:3000

# 交易配置
MAX_POSITION_SIZE=100
MIN_PROFIT_MARGIN=0.02
CHECK_INTERVAL=30000

# 风险管理配置
MAX_DAILY_LOSS=1000
MAX_POSITIONS=10

# 策略配置
ENABLE_COPY_TRADING=true
MIN_SIGNAL_STRENGTH=0.7
MIN_LARGE_TRADE_SIZE=1000

# 聪明钱地址（逗号分隔）
SMART_MONEY_ADDRESSES=

# 日志配置
LOG_LEVEL=info
ENABLE_DETAILED_LOGS=false
```

**保存文件**：
- nano: `Ctrl+X`, 然后 `Y`, 然后 `Enter`
- vi: 按 `Esc`, 输入 `:wq`, 然后 `Enter`

### 步骤 9: 生成 API 凭证

```bash
# 确保 .env 文件中已设置 PRIVATE_KEY
# 然后运行
npm run generate-api
```

**如果成功**，会显示：
```
✅ API 凭证生成成功！
📝 请将以下信息添加到 .env 文件中：
POLYMARKET_API_KEY=...
POLYMARKET_API_SECRET=...
POLYMARKET_API_PASSPHRASE=...
```

**将生成的凭证添加到 .env 文件**：

```bash
nano .env
# 添加生成的 API 凭证
```

### 步骤 10: 安装 PM2（进程管理器，推荐）

PM2 可以保持程序持续运行，并在服务器重启后自动启动。

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 步骤 11: 启动程序

#### 方法 1: 使用 PM2（推荐）

```bash
# 启动应用
pm2 start src/index.js --name poly-mcp-arbitrage

# 查看状态
pm2 status

# 查看日志
pm2 logs poly-mcp-arbitrage

# 设置开机自启
pm2 startup
# 运行上面命令显示的命令（需要 root 权限）
pm2 save
```

#### 方法 2: 直接运行（测试用）

```bash
# 直接运行（按 Ctrl+C 停止）
npm start
```

### 步骤 12: 配置防火墙（如果需要）

如果腾讯云服务器有防火墙，确保必要的端口已开放：

```bash
# 查看防火墙状态
sudo ufw status

# 如果需要开放端口（例如 SSH）
sudo ufw allow 22/tcp
sudo ufw enable
```

**注意**: 这个程序不需要开放额外的端口，因为它只是作为客户端连接外部 API。

## 一键安装脚本

你也可以使用以下脚本快速安装：

```bash
#!/bin/bash
# 一键安装脚本

set -e

echo "=== 开始安装 Polymarket 跟单套利程序 ==="

# 更新系统
echo "更新系统包..."
sudo apt update
sudo apt upgrade -y

# 安装 Node.js 18.x
echo "安装 Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Git
echo "安装 Git..."
sudo apt install -y git

# 克隆项目
echo "克隆项目..."
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp

# 安装依赖
echo "安装项目依赖..."
npm install

# 安装 PM2
echo "安装 PM2..."
sudo npm install -g pm2

# 复制环境变量模板
echo "创建 .env 文件..."
cp .env.example .env

echo ""
echo "✅ 安装完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件: nano ~/poly-mcp/.env"
echo "2. 设置 PRIVATE_KEY"
echo "3. 运行: npm run generate-api"
echo "4. 将生成的 API 凭证添加到 .env 文件"
echo "5. 启动程序: pm2 start src/index.js --name poly-mcp-arbitrage"
```

**使用方法**：

```bash
# 保存脚本
nano install.sh
# 粘贴上面的内容
# 保存并退出

# 给脚本执行权限
chmod +x install.sh

# 运行脚本
./install.sh
```

## 验证安装

安装完成后，验证一切正常：

```bash
# 1. 检查 Node.js 版本
node --version  # 应该 >= v18.0.0

# 2. 检查项目文件
cd ~/poly-mcp
ls -la

# 3. 检查依赖
npm list --depth=0

# 4. 检查 .env 文件
cat .env | grep -v "PRIVATE_KEY"  # 不显示私钥

# 5. 测试运行（如果已配置）
npm run generate-api
```

## 常用管理命令

### PM2 命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs poly-mcp-arbitrage

# 重启应用
pm2 restart poly-mcp-arbitrage

# 停止应用
pm2 stop poly-mcp-arbitrage

# 删除应用
pm2 delete poly-mcp-arbitrage

# 监控
pm2 monit

# 查看详细信息
pm2 info poly-mcp-arbitrage
```

### 更新代码

```bash
cd ~/poly-mcp
git pull
npm install
pm2 restart poly-mcp-arbitrage
```

## 故障排查

### 问题 1: npm install 很慢

**解决**: 使用国内镜像

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题 2: 权限错误

**解决**: 不要使用 sudo 运行 npm install（项目目录）

```bash
# 确保项目目录权限正确
chown -R $USER:$USER ~/poly-mcp
```

### 问题 3: Node.js 版本错误

**解决**: 升级 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 问题 4: 无法连接 GitHub

**解决**: 使用代理或镜像

```bash
# 如果 GitHub 访问慢，可以配置代理
# 或使用 gitee 镜像（如果有）
```

### 问题 5: PM2 命令找不到

**解决**: 重新安装 PM2

```bash
sudo npm install -g pm2
# 或使用 npx
npx pm2 start src/index.js --name poly-mcp-arbitrage
```

## 安全建议

1. **保护私钥**:
   ```bash
   # 设置 .env 文件权限
   chmod 600 ~/poly-mcp/.env
   ```

2. **使用非 root 用户**（推荐）:
   ```bash
   # 创建专用用户
   sudo useradd -m -s /bin/bash poly-mcp
   sudo su - poly-mcp
   # 然后重新克隆和安装
   ```

3. **定期更新**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **监控资源**:
   ```bash
   # 安装监控工具
   sudo apt install htop
   htop
   ```

## 腾讯云特定配置

### 安全组设置

在腾讯云控制台：
1. 进入云服务器控制台
2. 选择你的服务器
3. 点击"安全组"
4. 确保 SSH (22端口) 已开放
5. 不需要开放其他端口（程序作为客户端）

### 系统盘空间

确保有足够的磁盘空间：
```bash
# 查看磁盘使用情况
df -h

# 清理不需要的包
sudo apt autoremove -y
sudo apt autoclean
```

## 下一步

安装完成后：

1. ✅ 配置 `.env` 文件
2. ✅ 生成 API 凭证
3. ✅ 启动程序
4. ✅ 监控运行状态
5. ✅ 查看日志

## 参考文档

- 项目 README: [README.md](README.md)
- API 配置指南: [API_SETUP.md](API_SETUP.md)
- API 生成指南: [API_GENERATION_GUIDE.md](API_GENERATION_GUIDE.md)
- 部署指南: [DEPLOY.md](DEPLOY.md)
- 服务器快速启动: [SERVER_QUICK_START.md](SERVER_QUICK_START.md)

## 需要帮助？

如果遇到问题，请：

1. 查看相关文档
2. 检查日志: `pm2 logs poly-mcp-arbitrage`
3. 验证配置: `cat .env`（注意不要泄露私钥）
4. 检查 Node.js 版本: `node --version`
