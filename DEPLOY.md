# 服务器部署指南

本指南将帮助你在 UltaHost 服务器上部署 Polymarket 跟单套利程序。

## 前置要求

- Linux 服务器（Ubuntu/Debian/CentOS）
- Node.js 18+ 和 npm
- Git
- SSH 访问权限

## 部署步骤

### 1. 连接到服务器

使用 SSH 连接到你的服务器：

```bash
ssh username@your-server-ip
```

### 2. 安装 Node.js（如果还没有安装）

**Ubuntu/Debian:**
```bash
# 更新包列表
sudo apt update

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

**CentOS/RHEL:**
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装 Git（如果还没有安装）

```bash
# Ubuntu/Debian
sudo apt install -y git

# CentOS/RHEL
sudo yum install -y git
```

### 4. 克隆项目

```bash
# 进入合适的目录（例如 /var/www 或 ~/projects）
cd ~
# 或者
cd /var/www

# 克隆仓库
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
```

### 5. 安装依赖

```bash
npm install
```

### 6. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
# 或使用 vi
vi .env
```

在 `.env` 文件中填写必要的配置：
- `POLYMARKET_API_KEY`: 你的 Polymarket API 密钥
- `PRIVATE_KEY`: 你的私钥
- 其他配置参数

### 7. 安装 PM2（进程管理器，推荐）

PM2 可以保持程序持续运行，并在服务器重启后自动启动。

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start src/index.js --name poly-mcp-arbitrage

# 查看运行状态
pm2 status

# 查看日志
pm2 logs poly-mcp-arbitrage

# 设置开机自启
pm2 startup
pm2 save
```

### 8. 配置防火墙（如果需要）

如果服务器有防火墙，确保必要的端口已开放：

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp  # SSH
# 其他需要的端口...

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

## 使用 systemd（替代方案）

如果你不想使用 PM2，可以使用 systemd 服务：

### 创建 systemd 服务文件

```bash
sudo nano /etc/systemd/system/poly-mcp.service
```

添加以下内容（修改路径和用户）：

```ini
[Unit]
Description=Polymarket Arbitrage Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/poly-mcp
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 启用和启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable poly-mcp

# 启动服务
sudo systemctl start poly-mcp

# 查看状态
sudo systemctl status poly-mcp

# 查看日志
sudo journalctl -u poly-mcp -f
```

## 常用管理命令

### PM2 命令

```bash
# 启动
pm2 start src/index.js --name poly-mcp-arbitrage

# 停止
pm2 stop poly-mcp-arbitrage

# 重启
pm2 restart poly-mcp-arbitrage

# 删除
pm2 delete poly-mcp-arbitrage

# 查看日志
pm2 logs poly-mcp-arbitrage

# 查看详细信息
pm2 info poly-mcp-arbitrage

# 监控
pm2 monit
```

### systemd 命令

```bash
# 启动
sudo systemctl start poly-mcp

# 停止
sudo systemctl stop poly-mcp

# 重启
sudo systemctl restart poly-mcp

# 查看状态
sudo systemctl status poly-mcp

# 查看日志
sudo journalctl -u poly-mcp -n 100 -f
```

## 更新代码

当代码更新后，在服务器上执行：

```bash
cd ~/poly-mcp  # 或你的项目路径

# 拉取最新代码
git pull

# 安装新依赖（如果有）
npm install

# 重启应用
pm2 restart poly-mcp-arbitrage
# 或
sudo systemctl restart poly-mcp
```

## 故障排查

### 检查 Node.js 版本
```bash
node --version
```

### 查看应用日志
```bash
# PM2
pm2 logs poly-mcp-arbitrage

# systemd
sudo journalctl -u poly-mcp -f
```

### 检查端口占用
```bash
sudo netstat -tulpn | grep node
# 或
sudo ss -tulpn | grep node
```

### 检查进程运行
```bash
ps aux | grep node
```

### 检查环境变量
```bash
cat .env
```

## 安全建议

1. **保护私钥**: 确保 `.env` 文件权限正确
   ```bash
   chmod 600 .env
   ```

2. **使用非 root 用户**: 不要在 root 用户下运行应用

3. **定期备份**: 定期备份配置文件和重要数据

4. **监控资源**: 使用 `htop` 或 `top` 监控服务器资源使用情况

5. **日志轮转**: 配置日志轮转以防止日志文件过大

## 性能优化

- 根据服务器配置调整 `CHECK_INTERVAL`
- 监控内存和 CPU 使用情况
- 如果使用大量内存，考虑使用 Node.js 的 `--max-old-space-size` 参数

## 需要帮助？

如果遇到问题，请：
1. 查看日志文件
2. 检查环境变量配置
3. 验证 API 密钥和权限
4. 检查网络连接
