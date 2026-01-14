# 切换用户指南

## 当前情况

系统提示输入 `poly-mcp` 用户的密码，但你可能有以下几种情况：

## 解决方案

### 方案 1: 设置用户密码（如果还没有设置）

如果你刚创建用户，可能还没有设置密码。以 root 用户身份（或使用 sudo）设置密码：

```bash
# 如果是 root 用户，直接设置密码
passwd poly-mcp

# 如果使用 sudo
sudo passwd poly-mcp
```

然后输入新密码两次。设置完成后，再尝试切换用户：

```bash
su - poly-mcp
# 输入刚设置的密码
```

### 方案 2: 使用 sudo（如果你当前用户有 sudo 权限）

如果你当前登录的用户有 sudo 权限，可以不需要密码直接切换：

```bash
# 使用 sudo 切换到 poly-mcp 用户（不需要密码）
sudo su - poly-mcp
```

### 方案 3: 使用 SSH 密钥登录（推荐，无需密码）

如果你配置了 SSH 密钥，可以直接通过 SSH 登录，无需密码：

```bash
# 在本地机器上（或从当前会话退出）
exit  # 退出当前会话

# 使用 SSH 直接登录到 poly-mcp 用户（如果已配置 SSH 密钥）
ssh poly-mcp@your-server-ip
```

**设置 SSH 密钥登录**（如果还没有）：

1. 在本地机器生成 SSH 密钥（如果还没有）：
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. 将公钥复制到服务器：
```bash
ssh-copy-id poly-mcp@your-server-ip
```

或者手动复制：
```bash
cat ~/.ssh/id_ed25519.pub | ssh root@your-server-ip "mkdir -p /home/poly-mcp/.ssh && cat >> /home/poly-mcp/.ssh/authorized_keys && chown -R poly-mcp:poly-mcp /home/poly-mcp/.ssh && chmod 700 /home/poly-mcp/.ssh && chmod 600 /home/poly-mcp/.ssh/authorized_keys"
```

### 方案 4: 如果不设置密码，直接在当前用户下运行

如果只是为了部署程序，你也可以在当前用户下运行部署脚本。只需确保：

1. 当前用户有安装 Node.js 和 npm 的权限
2. 当前用户有创建目录和文件的权限

```bash
# 在当前用户下运行（不需要切换用户）
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
chmod +x deploy.sh
./deploy.sh
```

## 推荐操作步骤

**最简单的方式**（如果你当前是 root 用户或有 sudo 权限）：

```bash
# 1. 如果还没设置密码，先设置（可选）
sudo passwd poly-mcp

# 2. 使用 sudo 切换用户（推荐，不需要输入密码）
sudo su - poly-mcp

# 3. 现在你已经是 poly-mcp 用户了，可以运行部署脚本
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
chmod +x deploy.sh
./deploy.sh
```

**或者**（如果当前用户就可以）：

```bash
# 直接在当前用户下运行（不需要切换用户）
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
chmod +x deploy.sh
./deploy.sh
```

## 提示

- 如果你只是想快速部署，可以在当前用户下直接运行脚本
- 如果当前用户是 root，脚本会询问是否继续（输入 y 即可）
- 长期使用建议设置 SSH 密钥登录，更安全方便
