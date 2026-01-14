# 修复 Git 冲突问题

## 问题

执行 `git pull` 时出现：
```
error: Your local changes to the following files would be overwritten by merge:
        package.json
```

## 原因

本地有未提交的更改，与远程代码冲突。

## 解决方案

### 方法 1: 保存本地更改（推荐，如果想保留本地修改）

```bash
cd ~/poly-mcp

# 保存本地更改到暂存区
git stash

# 拉取最新代码
git pull

# 如果需要，恢复本地更改
git stash pop
```

### 方法 2: 放弃本地更改（推荐，如果想使用远程版本）

```bash
cd ~/poly-mcp

# 放弃本地更改，使用远程版本
git checkout -- package.json

# 拉取最新代码
git pull
```

### 方法 3: 完全重置（如果本地更改不重要）

```bash
cd ~/poly-mcp

# 查看本地更改
git status

# 放弃所有本地更改
git reset --hard HEAD

# 拉取最新代码
git pull
```

## 快速修复（推荐）

如果本地更改不重要，直接使用：

```bash
cd ~/poly-mcp && \
git reset --hard HEAD && \
git pull && \
echo "✅ 代码已更新"
```

## 检查本地更改

如果想先看看本地改了什么：

```bash
cd ~/poly-mcp

# 查看更改内容
git diff package.json

# 如果更改不重要，放弃它
git checkout -- package.json

# 然后拉取
git pull
```

## 完整流程

```bash
# 1. 进入项目目录
cd ~/poly-mcp

# 2. 放弃本地更改（使用远程版本）
git reset --hard HEAD

# 3. 拉取最新代码
git pull

# 4. 重新安装依赖（如果有新依赖）
npm install

# 5. 启动应用
pm2 start src/index.js --name poly-mcp-arbitrage

# 6. 查看日志
pm2 logs poly-mcp-arbitrage
```

## 如果 package.json 有重要更改

如果你想保留本地更改：

```bash
cd ~/poly-mcp

# 1. 查看更改
git diff package.json

# 2. 保存更改
git stash

# 3. 拉取代码
git pull

# 4. 恢复更改（可能需要解决冲突）
git stash pop

# 5. 如果有冲突，手动解决
nano package.json
# 解决冲突后
git add package.json
git commit -m "Merge local changes"
```

## 一键修复命令

```bash
cd ~/poly-mcp && \
git reset --hard HEAD && \
git pull && \
npm install && \
pm2 start src/index.js --name poly-mcp-arbitrage && \
pm2 logs poly-mcp-arbitrage --lines 20
```
