# 快速修复 .env 配置问题

## 当前问题

程序无法读取 `.env` 文件中的 `PRIVATE_KEY`。

## 立即修复步骤

### 步骤 1: 更新代码

```bash
cd ~/poly-mcp
git pull
```

### 步骤 2: 检查 .env 文件

```bash
# 检查文件是否存在
ls -la .env

# 如果不存在，创建它
cp .env.example .env
```

### 步骤 3: 编辑 .env 文件

```bash
nano .env
```

**至少添加这一行**：
```env
PRIVATE_KEY=0x你的私钥
```

保存：`Ctrl+X`, 然后 `Y`, 然后 `Enter`

### 步骤 4: 验证配置

```bash
# 运行配置检查（更新代码后可用）
npm run check-config

# 或者手动检查
cat .env | grep PRIVATE_KEY
```

### 步骤 5: 重启程序

```bash
# 如果使用 PM2
pm2 restart poly-mcp-arbitrage

# 或者重新启动
pm2 delete poly-mcp-arbitrage
cd ~/poly-mcp
pm2 start src/index.js --name poly-mcp-arbitrage
```

## 如果 git pull 失败

如果无法拉取代码，可以手动检查：

```bash
# 1. 检查 .env 文件
cd ~/poly-mcp
ls -la .env

# 2. 如果不存在，创建
cp .env.example .env

# 3. 编辑并添加 PRIVATE_KEY
nano .env

# 4. 验证文件内容（不显示完整私钥）
cat .env | grep PRIVATE_KEY | head -c 20
```

## 验证 .env 文件格式

确保 `.env` 文件格式正确：

```env
# 正确格式
PRIVATE_KEY=0x你的私钥

# 错误格式（不要有空格）
PRIVATE_KEY = 0x你的私钥

# 错误格式（不要有引号，除非值中有空格）
PRIVATE_KEY="0x你的私钥"
```

## 快速命令（一键修复）

```bash
cd ~/poly-mcp && \
git pull && \
[ ! -f .env ] && cp .env.example .env && \
echo "✅ 请编辑 .env 文件设置 PRIVATE_KEY: nano .env" || \
echo "✅ .env 文件已存在，请检查 PRIVATE_KEY 是否设置"
```
