<p align="center">
  <strong>Documentation languages / Языки документации / 文档语言</strong><br>
  <a href="README.md"><b>English</b></a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.zh-CN.md">中文</a>
</p>

# Stack (Uvwstack)

<p align="center">
  <img src="https://img.shields.io/badge/version-2.6.5-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=for-the-badge" alt="Docker">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&style=for-the-badge" alt="Node.js">
  <img src="https://img.shields.io/badge/License-Commercial-orange?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>Enterprise IT asset inventory: hardware, network, licenses, warehouse, and audit</strong>
</p>

---

## Table of contents

- [About](#about)
- [Features](#features)
- [Tech stack](#tech-stack)
- [System requirements](#system-requirements)
- [Quick start (Docker)](#quick-start-docker)
- [Deployment options](#deployment-options)
- [Database setup](#database-setup)
- [Connect Stack to MySQL / PostgreSQL](#connect-stack-to-mysql--postgresql)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Licensing](#licensing)
- [Updates](#updates)
- [Troubleshooting](#troubleshooting)
- [Copyright & contact](#copyright--contact)

---

## About

**Stack** (repository name: **Uvwstack**) is a web-based IT inventory platform for organizations that need centralized control over hardware, network assets, software licenses, warehouse stock, and audit trails.

Designed for:

- System administrators
- IT departments
- Asset managers
- Government and commercial organizations

All data is stored centrally and accessed through a modern browser UI (Russian, English, and Chinese interface).

Repository: [github.com/llDecsterll/uvwstack](https://github.com/llDecsterll/uvwstack)

---

## Features

| Module | Capabilities |
|--------|--------------|
| **Computers & servers** | PCs, laptops, servers, components, assignment history |
| **Network** | IP addresses, patch panels, routers, topology |
| **Warehouse** | Stock in/out, consumables, cartridges, licenses |
| **Employees** | Asset assignment, departments, responsibility tracking |
| **Audits & reports** | Activity log, inventory reports, warranties |
| **Security** | AES-256-CBC encryption, encrypted DB credentials, license binding |
| **Database** | Local JSON (default), MySQL 8, PostgreSQL 16 |
| **Docker** | Production image, compose profiles, host-network mode |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Motion |
| Backend | Node.js 20, Express |
| Build | Vite 6, esbuild |
| Databases | MySQL (`mysql2`), PostgreSQL (`pg`) |
| Deployment | Docker, PM2, optional Nginx/Caddy |

---

## System requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| OS | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |
| CPU | 1 core | 2 cores |
| RAM | 1 GB | 2 GB (+ DB on same host) |
| Disk | 10 GB free | 20 GB |
| Ports | 8080 (HTTP) | 443 with reverse proxy |

---

## Quick start (Docker)

```bash
git clone https://github.com/llDecsterll/uvwstack.git
cd uvwstack
cp .env.example .env
# Edit DB_ENCRYPTION_KEY in .env — use a long random secret
docker compose up -d --build
```

Open: **http://SERVER_IP:8080**

Default login: `admin` / `admin` — change immediately after first login.

---

## Deployment options

### Option 1 — App only (JSON storage)

```bash
docker compose up -d --build
```

Data is stored in Docker volume `uvwstack_data` (`/app/data/db.json`).

### Option 2 — App + MySQL in Docker (recommended)

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

| Setting | Value |
|---------|-------|
| Host | `mysql` |
| Database | `stack_db` |
| User | `stack_user` |
| Port | `3306` |

Passwords: see `.env.example` (`MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`).

Stack auto-connects on first start when `STACK_DEFAULT_DB_*` variables are set (included in `docker-compose.mysql.yml`).

### Option 3 — App + PostgreSQL in Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --build
```

| Setting | Value |
|---------|-------|
| Host | `postgres` |
| Database | `stack_db` |
| User | `stack_user` |
| Port | `5432` |

### Option 4 — Native MySQL/PostgreSQL on Ubuntu + Stack in Docker

If the database listens only on `127.0.0.1`, use **host network mode**:

```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
```

In Stack settings use host **`localhost`**.

If the database accepts external connections (`bind-address = 0.0.0.0`), use bridge mode and set host to:

- `172.17.0.1` (Docker bridge gateway on Linux), or
- `host.docker.internal` (enabled via `extra_hosts` in `docker-compose.yml`)

### Option 5 — Native install with PM2

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

See [DOCKER.md](./DOCKER.md) for extended Ubuntu Server guide.

---

## Database setup

### MySQL (native on Ubuntu)

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

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

### PostgreSQL (native on Ubuntu)

```bash
sudo apt install -y postgresql postgresql-contrib
```

In `postgresql.conf`: `listen_addresses = '*'`

In `pg_hba.conf` add:

```text
host    all    all    0.0.0.0/0    scram-sha-256
```

```sql
CREATE USER stack_user WITH PASSWORD 'YourStrongPassword';
CREATE DATABASE stack_db OWNER stack_user;
```

---

## Connect Stack to MySQL / PostgreSQL

1. Open **Settings** → **Database (MySQL / PostgreSQL)**
2. Select DB type
3. Enter connection parameters (see deployment option above)
4. Click **Test connection** — on success the working host is shown
5. Click **Apply DB and migrate** — tables are created and JSON data is migrated

> **Docker note:** `localhost` inside a container is not the Ubuntu host. Use `mysql` (compose service name), `172.17.0.1`, `host.docker.internal`, or host-network mode.

Encrypted credentials are stored in `/app/data/db_config.json` (Docker) or project root (PM2).

---

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | `3000` / `8080` in Docker |
| `NODE_ENV` | `production` / `development` | — |
| `DB_ENCRYPTION_KEY` | AES-256 key for data & credentials | **Change in production** |
| `STACK_DATA_DIR` | Persistent data directory | `/app/data` in Docker |
| `DB_HOST_GATEWAY` | Docker host alias for DB | `host.docker.internal` |
| `GITHUB_UPDATE_REPO` | Update check repository | `llDecsterll/uvwstack` |
| `STACK_DEFAULT_DB_*` | Auto-connect on first start | See `.env.example` |

Example `.env`:

```env
PORT=8080
NODE_ENV=production
DB_ENCRYPTION_KEY=your-long-random-secret-here
STACK_DATA_DIR=/app/data
GITHUB_UPDATE_REPO=https://github.com/llDecsterll/uvwstack.git
```

---

## Project structure

```text
uvwstack/
├── src/                    # React frontend
├── server.ts               # Express API, DB, encryption, license checks
├── Dockerfile
├── docker-compose
│   ├── docker-compose.yml          # App only
│   ├── docker-compose.mysql.yml    # + MySQL
│   ├── docker-compose.postgres.yml # + PostgreSQL
│   └── docker-compose.host.yml     # Host network mode
├── scripts/verify-flow.mjs # Smoke tests
├── README.md               # English (this file)
├── README.ru.md            # Russian
├── README.zh-CN.md         # Chinese
├── DOCKER.md               # Extended deployment guide (RU)
├── COPYRIGHT.md
└── .env.example
```

---

## Licensing

- **30-day trial** from first launch
- Hardware-bound activation via Request Code: `REQ-XXXX-XXXX-XXXX-CHKS`
- License key format: `UTKIN-{payload}-{hash}`
- Keys are issued by the separate **keyserver** (not included in this repository)
- Client cannot generate valid keys locally

Contact for commercial license: assetorbit@icloud.com

---

## Updates

### Docker

```bash
cd uvwstack
git pull
docker compose down
docker compose up -d --build
```

Or use **Settings → Update center** in the UI (checks GitHub releases).

### PM2

```bash
git pull && npm install && npm run build
pm2 restart uvwstack
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Connection refused to DB from Docker** | Use `172.17.0.1` or host-network compose; set MySQL `bind-address=0.0.0.0` |
| **Test fails with masked password** | Fixed in v2.6.4+ — leave password empty if already saved, or re-enter it |
| **No Dockerfile found** | Run compose from repo root (`~/uvwstack`), not nested folder |
| **Port 8080 in use** | Change `PORT` in `.env` and `docker-compose.yml` ports mapping |
| **Build OOM on small VPS** | `SKIP_OBFUSCATION=true` is set in Dockerfile by default |

Check logs:

```bash
docker compose logs -f uvwstack-app
```

Run local smoke tests (with server on port 8098):

```bash
npm run build && PORT=8098 node dist/server.cjs &
node scripts/verify-flow.mjs http://127.0.0.1:8098
```

---

## Copyright & contact

© 2026 **Utkin Vladislav Vyacheslavovich** (Уткин Владислав Вячеславович). All rights reserved.

See [COPYRIGHT.md](./COPYRIGHT.md) for full terms.

| | |
|---|---|
| Email | assetorbit@icloud.com |
| Telegram | [@Dexterll](https://t.me/Dexterll) |
| GitHub | [llDecsterll/uvwstack](https://github.com/llDecsterll/uvwstack) |

If Stack is useful for your organization — star the repository and report issues via GitHub Issues.

---

<p align="center">Built for efficient IT infrastructure management</p>
