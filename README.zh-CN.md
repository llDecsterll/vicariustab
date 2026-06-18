<p align="center">
  <strong>文档语言 / Documentation languages / Языки документации</strong><br>
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.zh-CN.md"><b>中文</b></a>
</p>

# Stack (Uvwstack)

<p align="center">
  <img src="https://img.shields.io/badge/版本-2.6.5-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=for-the-badge" alt="Docker">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&style=for-the-badge" alt="Node.js">
  <img src="https://img.shields.io/badge/许可证-Commercial-orange?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>企业 IT 资产管理系统：硬件、网络、许可证、仓库与审计</strong>
</p>

---

## 目录

- [项目简介](#项目简介)
- [主要功能](#主要功能)
- [技术栈](#技术栈)
- [系统要求](#系统要求)
- [快速开始（Docker）](#快速开始docker)
- [部署方式](#部署方式)
- [数据库配置](#数据库配置)
- [连接 MySQL / PostgreSQL](#连接-mysql--postgresql)
- [环境变量](#环境变量)
- [项目结构](#项目结构)
- [许可证](#许可证)
- [更新系统](#更新系统)
- [故障排除](#故障排除)
- [版权与联系](#版权与联系)

---

## 项目简介

**Stack**（仓库名：**Uvwstack**）是基于 Web 的企业 IT 资产集中管理与盘点平台。

适用于：

- 系统管理员
- IT 部门
- 资产管理员
- 政府及商业机构

可管理计算机、服务器、网络设备、办公设备、配件、软件许可证、仓库库存及审计日志。界面支持中文、俄语和英语。

代码仓库：[github.com/llDecsterll/uvwstack](https://github.com/llDecsterll/uvwstack)

---

## 主要功能

| 模块 | 说明 |
|------|------|
| **计算机与服务器** | PC、笔记本、服务器、配件、使用历史 |
| **网络** | IP 地址、配线架、路由器、拓扑 |
| **仓库** | 入库/出库、耗材、硒鼓、许可证 |
| **员工** | 设备分配、部门、责任追踪 |
| **审计与报表** | 操作日志、盘点报表、保修 |
| **安全** | AES-256-CBC 加密、数据库凭据加密、许可证绑定 |
| **数据库** | 本地 JSON（默认）、MySQL 8、PostgreSQL 16 |
| **Docker** | 生产镜像、Compose 配置、Host 网络模式 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19、TypeScript、Tailwind CSS 4、Motion |
| 后端 | Node.js 20、Express |
| 构建 | Vite 6、esbuild |
| 数据库 | MySQL（mysql2）、PostgreSQL（pg） |
| 部署 | Docker、PM2、可选 Nginx/Caddy |

---

## 系统要求

| 资源 | 最低 | 推荐 |
|------|------|------|
| 操作系统 | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |
| CPU | 1 核 | 2 核 |
| 内存 | 1 GB | 2 GB（同机部署数据库时） |
| 磁盘 | 10 GB 可用 | 20 GB |
| 端口 | 8080（HTTP） | 443（反向代理） |

---

## 快速开始（Docker）

```bash
git clone https://github.com/llDecsterll/uvwstack.git
cd uvwstack
cp .env.example .env
# 在 .env 中设置安全的 DB_ENCRYPTION_KEY
docker compose up -d --build
```

浏览器访问：**http://服务器IP:8080**

默认账号：`admin` / `admin` — 首次登录后请立即修改密码。

---

## 部署方式

### 方式 1 — 仅应用（JSON 存储）

```bash
docker compose up -d --build
```

数据保存在 Docker 卷 `uvwstack_data`（`/app/data/db.json`）。

### 方式 2 — 应用 + Docker 内 MySQL（推荐）

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

| 参数 | 值 |
|------|-----|
| 主机 | `mysql` |
| 数据库 | `stack_db` |
| 用户 | `stack_user` |
| 端口 | `3306` |

密码见 `.env.example`（`MYSQL_PASSWORD`、`MYSQL_ROOT_PASSWORD`）。

首次启动时，Stack 会通过 `STACK_DEFAULT_DB_*` 环境变量自动连接（已在 `docker-compose.mysql.yml` 中配置）。

### 方式 3 — 应用 + Docker 内 PostgreSQL

```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --build
```

| 参数 | 值 |
|------|-----|
| 主机 | `postgres` |
| 数据库 | `stack_db` |
| 用户 | `stack_user` |
| 端口 | `5432` |

### 方式 4 — Ubuntu 本地数据库 + Docker 应用

若数据库仅监听 `127.0.0.1`，请使用 **Host 网络模式**：

```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
```

在 Stack 设置中填写主机 **`localhost`**。

若数据库允许外部连接（`bind-address = 0.0.0.0`），在 bridge 模式下使用：

- `172.17.0.1`（Linux Docker 网桥网关），或
- `host.docker.internal`（已在 `docker-compose.yml` 中配置）

### 方式 5 — PM2 原生安装

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
cp .env.example .env
npm install
npm run build
sudo npm install -g pm2
PORT=8080 NODE_ENV=production pm2 start dist/server.cjs --name uvwstack
pm2 startup systemd && pm2 save
```

详细 Ubuntu 部署指南：[DOCKER.md](./DOCKER.md)（俄语）

---

## 数据库配置

### MySQL（Ubuntu 本地安装）

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`：

```ini
bind-address = 0.0.0.0
```

```sql
CREATE DATABASE stack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stack_user'@'%' IDENTIFIED BY 'YourStrongPassword';
GRANT ALL PRIVILEGES ON stack_db.* TO 'stack_user'@'%';
FLUSH PRIVILEGES;
```

```bash
sudo systemctl restart mysql
```

### PostgreSQL（Ubuntu 本地安装）

```bash
sudo apt install -y postgresql postgresql-contrib
```

`postgresql.conf`：`listen_addresses = '*'`

`pg_hba.conf` 添加：

```text
host    all    all    0.0.0.0/0    scram-sha-256
```

```sql
CREATE USER stack_user WITH PASSWORD 'YourStrongPassword';
CREATE DATABASE stack_db OWNER stack_user;
```

---

## 连接 MySQL / PostgreSQL

1. 打开 **设置** → **数据库（MySQL / PostgreSQL）**
2. 选择数据库类型
3. 填写连接参数（见上方部署方式）
4. 点击 **测试连接** — 成功后会显示可用主机地址
5. 点击 **应用数据库并迁移** — 自动建表并将 JSON 数据迁移至数据库

> **Docker 提示：** 容器内的 `localhost` 不是 Ubuntu 宿主机。请使用 `mysql`（服务名）、`172.17.0.1`、`host.docker.internal` 或 Host 网络模式。

加密凭据保存在 `/app/data/db_config.json`（Docker）或项目根目录（PM2）。

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | HTTP 端口 | Docker 中为 `8080` |
| `NODE_ENV` | `production` / `development` | — |
| `DB_ENCRYPTION_KEY` | AES-256 密钥 | **生产环境必须修改** |
| `STACK_DATA_DIR` | 数据目录 | Docker 中为 `/app/data` |
| `DB_HOST_GATEWAY` | Docker 宿主机别名 | `host.docker.internal` |
| `GITHUB_UPDATE_REPO` | 更新检查仓库 | `llDecsterll/uvwstack` |
| `STACK_DEFAULT_DB_*` | 首次启动自动连接 | 见 `.env.example` |

`.env` 示例：

```env
PORT=8080
NODE_ENV=production
DB_ENCRYPTION_KEY=your-long-random-secret
STACK_DATA_DIR=/app/data
GITHUB_UPDATE_REPO=https://github.com/llDecsterll/uvwstack.git
```

---

## 项目结构

```text
uvwstack/
├── src/                         # React 前端
├── server.ts                    # Express API、数据库、加密
├── Dockerfile
├── docker-compose.yml           # 仅应用
├── docker-compose.mysql.yml     # + MySQL
├── docker-compose.postgres.yml  # + PostgreSQL
├── docker-compose.host.yml      # Host 网络
├── scripts/verify-flow.mjs      # 冒烟测试
├── README.md / README.ru.md / README.zh-CN.md
├── DOCKER.md
├── COPYRIGHT.md
└── .env.example
```

---

## 许可证

- 首次启动后 **30 天** 试用期
- 硬件绑定激活，请求码格式：`REQ-XXXX-XXXX-XXXX-CHKS`
- 许可证密钥格式：`UTKIN-{payload}-{hash}`
- 密钥由独立 **keyserver** 签发（不包含在本仓库）
- 客户端无法本地生成有效密钥

商业许可联系：assetorbit@icloud.com

---

## 更新系统

### Docker

```bash
cd uvwstack
git pull
docker compose down
docker compose up -d --build
```

或在界面 **设置 → 更新中心** 检查 GitHub 版本。

### PM2

```bash
git pull && npm install && npm run build
pm2 restart uvwstack
```

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| **Docker 内连接数据库被拒绝** | 使用 `172.17.0.1` 或 `docker-compose.host.yml`；MySQL 设置 `bind-address=0.0.0.0` |
| **测试连接时密码错误** | v2.6.4+ 已修复 — 已保存密码时可留空，或重新输入 |
| **找不到 Dockerfile** | 在仓库根目录 `~/uvwstack` 运行 compose |
| **8080 端口被占用** | 修改 `.env` 中的 `PORT` 及 compose 端口映射 |
| **小内存 VPS 构建失败** | Dockerfile 已默认 `SKIP_OBFUSCATION=true` |

查看日志：

```bash
docker compose logs -f uvwstack-app
```

查看 Docker 网关：

```bash
ip addr show docker0 | grep inet
# 通常为：172.17.0.1
```

冒烟测试：

```bash
npm run build && PORT=8098 node dist/server.cjs &
node scripts/verify-flow.mjs http://127.0.0.1:8098
```

---

## 版权与联系

© 2026 **Utkin Vladislav Vyacheslavovich**（Уткин Владислав Вячеславович）。保留所有权利。

详见 [COPYRIGHT.md](./COPYRIGHT.md)

| | |
|---|---|
| 邮箱 | assetorbit@icloud.com |
| Telegram | [@Dexterll](https://t.me/Dexterll) |
| GitHub | [llDecsterll/uvwstack](https://github.com/llDecsterll/uvwstack) |

若 Stack 对您有帮助，欢迎为仓库点 Star，并通过 GitHub Issues 反馈问题。

---

<p align="center">为高效 IT 基础设施管理而构建</p>
