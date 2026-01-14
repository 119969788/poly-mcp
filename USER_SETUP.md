# 用户设置指南

## 为什么建议使用非 root 用户？

出于安全考虑，建议使用普通用户而非 root 用户运行应用程序：

1. **安全性**: 如果应用被攻击，攻击者只能获得普通用户权限，而不是 root 权限
2. **系统稳定性**: 避免意外修改系统文件
3. **最佳实践**: 符合 Linux 安全最佳实践

## 创建专用用户（推荐）

### 步骤 1: 创建用户

以 root 用户身份（或使用 sudo）创建专用用户：

```bash
# 创建用户（例如：poly-mcp）
sudo useradd -m -s /bin/bash poly-mcp

# 或者创建用户并添加到 sudo 组（如果需要）
sudo useradd -m -s /bin/bash -G sudo poly-mcp

# 设置密码（可选，如果使用 SSH 密钥可以跳过）
sudo passwd poly-mcp
```

### 步骤 2: 切换到新用户

```bash
# 切换到新用户
su - poly-mcp

# 或者使用 SSH 直接登录
ssh poly-mcp@your-server-ip
```

### 步骤 3: 运行部署脚本

```bash
# 以普通用户身份运行
./deploy.sh
```

## 如果必须使用 root 用户

如果你需要使用 root 用户运行（例如在容器环境中），脚本现在会：

1. 显示警告提示
2. 询问是否继续
3. 如果选择继续，会正常执行部署

但请注意安全风险。

## 使用 sudo（另一种选择）

如果你想保持 root 权限但以普通用户运行脚本，可以使用 sudo：

```bash
# 创建普通用户
sudo useradd -m -s /bin/bash poly-mcp

# 切换到普通用户
su - poly-mcp

# 在需要 root 权限的命令前使用 sudo
sudo npm install -g pm2
```

## 文件权限设置

部署完成后，确保文件权限正确：

```bash
# 如果以 root 用户部署，后续切换到普通用户时，需要更改文件所有者
sudo chown -R poly-mcp:poly-mcp ~/poly-mcp

# 保护 .env 文件
chmod 600 .env
```

## 常见问题

### Q: 如何查看当前用户？

```bash
whoami
```

### Q: 如何查看用户 ID？

```bash
id
```

### Q: 如何切换到另一个用户？

```bash
su - username
```

### Q: PM2 需要 root 权限吗？

PM2 本身不需要 root 权限，但设置开机自启时（`pm2 startup`）可能需要。

### Q: 如果以普通用户运行，如何安装全局 npm 包？

使用 `sudo`：
```bash
sudo npm install -g pm2
```

或者配置 npm 使用用户目录（推荐）：
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g pm2
```
