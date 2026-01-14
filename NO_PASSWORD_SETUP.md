# 免密码设置指南

## 配置用户免密码切换

如果你想要切换到 `poly-mcp` 用户时不需要输入密码，可以配置免密码切换。

## 方法 1: 配置 sudo 免密码（推荐）

如果你当前用户有 sudo 权限，可以配置 sudo 免密码切换：

```bash
# 编辑 sudoers 文件（使用 visudo 是安全的）
sudo visudo

# 添加以下行（将 your-username 替换为当前用户名）
your-username ALL=(poly-mcp) NOPASSWD: /bin/su

# 保存退出（nano: Ctrl+X, Y, Enter | vi: :wq）
```

然后可以使用以下命令切换，无需密码：

```bash
sudo su - poly-mcp
```

## 方法 2: 配置用户组免密码切换

配置当前用户可以在不输入密码的情况下切换到 poly-mcp：

```bash
# 以 root 用户编辑以下文件
sudo nano /etc/pam.d/su

# 找到或添加以下行（允许 wheel 组成员免密码切换）
# auth sufficient pam_wheel.so trust use_uid

# 将当前用户添加到 wheel 组（如果使用此方法）
sudo usermod -aG wheel your-username
```

## 方法 3: 使用 SSH 密钥直接登录（最佳实践）

配置 SSH 密钥后，可以直接登录到 poly-mcp 用户，无需密码：

### 在本地机器上：

```bash
# 1. 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"
# 按 Enter 使用默认路径
# 可以设置密码短语，或直接按 Enter 不设置

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 在服务器上：

```bash
# 1. 切换到 poly-mcp 用户（需要一次密码）
sudo su - poly-mcp

# 2. 创建 .ssh 目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. 添加公钥到 authorized_keys
nano ~/.ssh/authorized_keys
# 粘贴刚才复制的公钥内容，保存退出

# 4. 设置正确的权限
chmod 600 ~/.ssh/authorized_keys
chown -R poly-mcp:poly-mcp ~/.ssh

# 5. 退出
exit
```

### 以后可以直接登录：

```bash
# 从本地直接 SSH 登录到 poly-mcp 用户，无需密码
ssh poly-mcp@your-server-ip
```

## 方法 4: 配置 NOPASSWD sudo（如果使用 sudo）

如果你经常需要 sudo 权限，可以配置当前用户免密码使用 sudo：

```bash
# 编辑 sudoers 文件
sudo visudo

# 添加以下行（将 your-username 替换为当前用户名）
your-username ALL=(ALL) NOPASSWD: ALL

# 保存退出
```

**注意**: 这个方法会给予当前用户所有 sudo 权限且免密码，安全性较低，请谨慎使用。

## 方法 5: 直接在当前用户下运行（最简单）

如果只是为了部署程序，**建议直接在当前用户下运行**，不需要切换用户：

```bash
# 直接在当前用户下运行部署脚本
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
chmod +x deploy.sh
./deploy.sh
```

这样就不需要处理用户切换和密码问题了。

## 推荐方案

1. **短期/一次性部署**: 使用方法 5（直接在当前用户下运行）
2. **长期使用，安全性优先**: 使用方法 3（SSH 密钥）
3. **需要频繁切换用户**: 使用方法 1（配置 sudo 免密码切换）

## 安全提示

- SSH 密钥比密码更安全
- 避免使用 NOPASSWD: ALL 这种过于宽泛的配置
- 定期更换密钥和密码
- 限制 SSH 访问（使用防火墙）
