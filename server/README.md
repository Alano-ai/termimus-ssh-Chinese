# Termimus 同步服务器

为 **Termimus**（本地优先的 SSH 与服务器管理器）打造的一个轻量级、零知识、自托管的同步中继服务器。

## 🔒 零知识安全架构

- **端到端加密（E2EE）**：所有主机、文件夹、代码片段、隧道和凭据都在你的本地客户端设备上，使用由主密码经 **Argon2id** 派生的密钥通过 **AES-256-GCM** 进行加密。
- **盲中继**：服务器只接收、存储和转发加密的密文包（`EncryptedBackupEnvelope`）。它**永远无法**访问你的主密码或加密密钥。
- **隐私优先**：即使你的服务器 VPS 被入侵，攻击者也只能获得加密后的数据块，无法访问你的服务器、SSH 私钥或密码。
- **实时 WebSocket**：当其他设备发生更改时，已连接设备会立即收到推送通知。

---

## 🚀 快速开始

### 方式 1：Docker（单条命令）

```bash
docker run -d \
  --name termimus-sync \
  -p 8080:8080 \
  -v termimus_data:/data \
  -e TERMIMUS_AUTH_TOKEN="$(openssl rand -hex 32)" \
  --restart unless-stopped \
  ghcr.io/termimus/termimus-sync:latest
```

### 方式 2：Docker Compose

```bash
cd server
echo "TERMIMUS_AUTH_TOKEN=$(openssl rand -hex 32)" > .env
docker compose up -d
```

### 方式 3：从源码运行（Go）

需要 Go 1.22+：

```bash
cd server
export TERMIMUS_AUTH_TOKEN="your-secret-token"
export PORT="8080"
go run ./cmd/server
```

---

## ⚙️ 配置（环境变量）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 监听的 HTTP 与 WebSocket 端口 |
| `DATA_DIR` | `./data` | SQLite 数据库存储目录 |
| `DB_PATH` | `./data/sync.db` | SQLite 数据库文件的精确路径 |
| `TERMIMUS_AUTH_TOKEN` | — | **必填。** 客户端必须携带的 Bearer 令牌。请使用较长的随机值（`openssl rand -hex 32`）；缺少该值时服务器会拒绝启动。 |
| `TERMIMUS_ALLOW_OPEN_MODE` | — | 设为 `1` 可无令牌运行。仅用于本地测试：任何能访问该端口的人都可以覆盖你的同步数据。 |

---

## 📡 API 参考

所有 `/api/v1/sync/*` 端点都要求携带 `Authorization: Bearer <TOKEN>` 请求头（WebSocket 则使用 `?token=<TOKEN>`）。

### 1. 健康检查
`GET /health`
```json
{
  "status": "ok",
  "service": "termimus-sync-server",
  "version": "0.1.0"
}
```

### 2. 获取同步状态
`GET /api/v1/sync/status`
```json
{
  "has_data": true,
  "latest_version": 4,
  "device_id": "laptop-fedora-1234",
  "device_name": "Fedora Work Laptop",
  "updated_at": "2026-09-23T15:30:00Z"
}
```

### 3. 下载最新加密包
`GET /api/v1/sync/bundle`
```json
{
  "version": 4,
  "encrypted_blob": "{\"format_version\":2,\"encrypted\":true,...}"
}
```

### 4. 上传新的加密包
`POST /api/v1/sync/bundle`
```json
{
  "device_id": "laptop-fedora-1234",
  "device_name": "Fedora Work Laptop",
  "encrypted_blob": "{\"format_version\":2,\"encrypted\":true,...}"
}
```

### 5. WebSocket 实时通知流
`GET /api/v1/sync/ws?token=<TOKEN>`

客户端会收到：
```json
{
  "type": "SYNC_UPDATED",
  "version": 5,
  "device_id": "work-pc",
  "device_name": "Work PC"
}
```

---

## 🌐 反向代理示例

### Caddy
```caddy
sync.yourdomain.com {
    reverse_proxy localhost:8080
}
```

### Nginx
```nginx
server {
    server_name sync.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
