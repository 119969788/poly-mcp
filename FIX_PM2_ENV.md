# 修复 PM2 无法读取 .env 文件的问题

## 问题

即使 `.env` 文件中已设置 `PRIVATE_KEY`，PM2 运行的程序仍然报错无法读取。

## 原因

PM2 可能从错误的工作目录启动，或者环境变量没有正确加载。

## 解决方案

### 方法 1: 重新启动 PM2（从项目目录）

```bash
# 1. 停止当前应用
pm2 stop poly-mcp-arbitrage
pm2 delete poly-mcp-arbitrage

# 2. 确保在项目目录
cd ~/poly-mcp

# 3. 更新代码（获取最新修复）
git pull

# 4. 从项目目录启动（重要！）
pm2 start src/index.js --name poly-mcp-arbitrage

# 5. 查看日志
pm2 logs poly-mcp-arbitrage
```

### 方法 2: 使用环境变量文件（PM2 ecosystem）

创建 PM2 配置文件：

```bash
cd ~/poly-mcp
nano ecosystem.config.js
```

添加以下内容：

```javascript
module.exports = {
  apps: [{
    name: 'poly-mcp-arbitrage',
    script: 'src/index.js',
    cwd: '/root/poly-mcp',  // 你的项目路径
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

然后使用配置文件启动：

```bash
pm2 delete poly-mcp-arbitrage
pm2 start ecosystem.config.js
pm2 save
```

### 方法 3: 直接在启动命令中指定工作目录

```bash
pm2 delete poly-mcp-arbitrage
cd ~/poly-mcp
pm2 start src/index.js --name poly-mcp-arbitrage --cwd /root/poly-mcp
pm2 save
```

### 方法 4: 验证 PM2 工作目录

```bash
# 查看 PM2 应用信息
pm2 info poly-mcp-arbitrage

# 检查 "exec cwd" 字段
# 应该显示: /root/poly-mcp

# 如果不对，删除并重新启动
pm2 delete poly-mcp-arbitrage
cd ~/poly-mcp
pm2 start src/index.js --name poly-mcp-arbitrage
```

## 验证修复

### 步骤 1: 检查 .env 文件

```bash
cd ~/poly-mcp
cat .env | grep PRIVATE_KEY
# 应该显示: PRIVATE_KEY=0x...
```

### 步骤 2: 更新代码并检查配置

```bash
cd ~/poly-mcp
git pull
npm run check-config
```

### 步骤 3: 重启 PM2

```bash
pm2 restart poly-mcp-arbitrage
pm2 logs poly-mcp-arbitrage --lines 20
```

应该看到：
```
✅ 连接到 Polymarket...
   钱包地址: 0x...
```

而不是：
```
❌ 未设置 PRIVATE_KEY
```

## 如果仍然不行

### 检查文件权限

```bash
cd ~/poly-mcp
ls -la .env
# 应该显示: -rw------- (600 权限)

# 如果不对，修复权限
chmod 600 .env
```

### 检查文件格式

```bash
# 检查是否有 BOM 或特殊字符
file .env

# 检查行尾格式
cat -A .env | grep PRIVATE_KEY
# 应该显示: PRIVATE_KEY=0x...$ (Unix 格式)
```

### 手动测试环境变量加载

```bash
cd ~/poly-mcp
node -e "
require('dotenv').config();
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? '已设置 (' + process.env.PRIVATE_KEY.substring(0, 10) + '...)' : '未设置');
"
```

如果这里能读取到，说明问题在 PM2 的工作目录。

## 完整修复流程

```bash
# 1. 进入项目目录
cd ~/poly-mcp

# 2. 更新代码
git pull

# 3. 验证 .env 文件
cat .env | grep PRIVATE_KEY

# 4. 检查配置
npm run check-config

# 5. 停止 PM2
pm2 stop poly-mcp-arbitrage
pm2 delete poly-mcp-arbitrage

# 6. 从项目目录重新启动
pm2 start src/index.js --name poly-mcp-arbitrage

# 7. 查看日志
pm2 logs poly-mcp-arbitrage

# 8. 如果成功，保存配置
pm2 save
```
