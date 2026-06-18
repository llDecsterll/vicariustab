<p align="center">
  <strong>Языки документации / Documentation languages / 文档语言</strong><br>
  <a href="README.md">English</a> ·
  <a href="README.ru.md"><b>Русский</b></a> ·
  <a href="README.zh-CN.md">中文</a>
</p>

# Stack (Uvwstack)

<p align="center">
  <img src="https://img.shields.io/badge/версия-2.6.5-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=for-the-badge" alt="Docker">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&style=for-the-badge" alt="Node.js">
  <img src="https://img.shields.io/badge/Лицензия-Commercial-orange?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>Корпоративная система учёта IT-инфраструктуры: оборудование, сеть, лицензии, склад и аудит</strong>
</p>

---

## Содержание

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Технологии](#технологии)
- [Системные требования](#системные-требования)
- [Быстрый старт (Docker)](#быстрый-старт-docker)
- [Варианты развёртывания](#варианты-развёртывания)
- [Настройка СУБД](#настройка-субд)
- [Подключение Stack к MySQL / PostgreSQL](#подключение-stack-к-mysql--postgresql)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [Лицензирование](#лицензирование)
- [Обновление](#обновление)
- [Устранение неполадок](#устранение-неполадок)
- [Авторское право и контакты](#авторское-право-и-контакты)

---

## О проекте

**Stack** (репозиторий: **Uvwstack**) — веб-платформа централизованного учёта и инвентаризации IT-активов предприятия.

Подходит для:

- системных администраторов;
- IT-отделов;
- материально ответственных лиц;
- государственных и коммерческих организаций.

Учёт ведётся по компьютерам, серверам, сетевому оборудованию, оргтехнике, комплектующим, лицензиям, складским запасам и журналам аудита. Интерфейс поддерживает русский, английский и китайский языки.

Репозиторий: [github.com/llDecsterll/uvwstack](https://github.com/llDecsterll/uvwstack)

---

## Возможности

| Модуль | Функции |
|--------|---------|
| **Компьютеры и серверы** | ПК, ноутбуки, серверы, комплектующие, история эксплуатации |
| **Сеть** | IP-адреса, патч-панели, маршрутизаторы, топология |
| **Склад** | Приход/списание, расходники, картриджи, лицензии |
| **Сотрудники** | Закрепление техники, отделы, материальная ответственность |
| **Аудит и отчёты** | Журнал изменений, инвентаризация, гарантии |
| **Безопасность** | AES-256-CBC, шифрование учётных данных СУБД, привязка лицензии |
| **Базы данных** | JSON (по умолчанию), MySQL 8, PostgreSQL 16 |
| **Docker** | Production-образ, compose-профили, режим host-сети |

---

## Технологии

| Компонент | Технология |
|-----------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Motion |
| Backend | Node.js 20, Express |
| Сборка | Vite 6, esbuild |
| СУБД | MySQL (`mysql2`), PostgreSQL (`pg`) |
| Развёртывание | Docker, PM2, Nginx/Caddy (опционально) |

---

## Системные требования

| Ресурс | Минимум | Рекомендуется |
|--------|---------|---------------|
| ОС | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |
| CPU | 1 ядро | 2 ядра |
| RAM | 1 GB | 2 GB (если СУБД на том же сервере) |
| Диск | 10 GB | 20 GB |
| Порты | 8080 (HTTP) | 443 с reverse proxy |

---

## Быстрый старт (Docker)

```bash
git clone https://github.com/llDecsterll/uvwstack.git
cd uvwstack
cp .env.example .env
# Задайте надёжный DB_ENCRYPTION_KEY в .env
docker compose up -d --build
```

Откройте: **http://IP_СЕРВЕРА:8080**

Вход по умолчанию: `admin` / `admin` — смените пароль после первого входа.

---

## Варианты развёртывания

### Вариант 1 — Только приложение (JSON)

```bash
docker compose up -d --build
```

Данные хранятся в томе Docker `uvwstack_data` (`/app/data/db.json`).

### Вариант 2 — Приложение + MySQL в Docker (рекомендуется)

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

| Параметр | Значение |
|----------|----------|
| Хост | `mysql` |
| База | `stack_db` |
| Пользователь | `stack_user` |
| Порт | `3306` |

Пароли: см. `.env.example` (`MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`).

При первом запуске Stack автоматически подключается к БД через переменные `STACK_DEFAULT_DB_*` (уже заданы в `docker-compose.mysql.yml`).

### Вариант 3 — Приложение + PostgreSQL в Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --build
```

| Параметр | Значение |
|----------|----------|
| Хост | `postgres` |
| База | `stack_db` |
| Пользователь | `stack_user` |
| Порт | `5432` |

### Вариант 4 — MySQL/PostgreSQL на Ubuntu + Stack в Docker

Если СУБД слушает только `127.0.0.1`, используйте **режим host-сети**:

```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
```

В настройках Stack укажите хост **`localhost`**.

Если СУБД принимает внешние подключения (`bind-address = 0.0.0.0`), в bridge-режиме укажите:

- `172.17.0.1` (шлюз Docker на Linux), или
- `host.docker.internal` (настроено в `docker-compose.yml`)

### Вариант 5 — Нативная установка (PM2)

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

Подробное руководство для Ubuntu Server: [DOCKER.md](./DOCKER.md)

---

## Настройка СУБД

### MySQL (на Ubuntu)

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

Файл `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
bind-address = 0.0.0.0
```

```sql
CREATE DATABASE stack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stack_user'@'%' IDENTIFIED BY 'НадёжныйПароль';
GRANT ALL PRIVILEGES ON stack_db.* TO 'stack_user'@'%';
FLUSH PRIVILEGES;
```

```bash
sudo systemctl restart mysql
```

### PostgreSQL (на Ubuntu)

```bash
sudo apt install -y postgresql postgresql-contrib
```

В `postgresql.conf`: `listen_addresses = '*'`

В `pg_hba.conf`:

```text
host    all    all    0.0.0.0/0    scram-sha-256
```

```sql
CREATE USER stack_user WITH PASSWORD 'НадёжныйПароль';
CREATE DATABASE stack_db OWNER stack_user;
```

---

## Подключение Stack к MySQL / PostgreSQL

1. **Настройки** → **Параметры СУБД (MySQL / PostgreSQL)**
2. Выберите тип СУБД
3. Заполните параметры подключения (см. вариант развёртывания выше)
4. **Проверить соединение** — при успехе отображается рабочий хост
5. **Применить СУБД и мигрировать** — создаются таблицы, данные из JSON переносятся в СУБД

> **Важно для Docker:** `localhost` внутри контейнера — это не Ubuntu-хост. Используйте `mysql` (имя сервиса), `172.17.0.1`, `host.docker.internal` или host-сеть.

Зашифрованные учётные данные: `/app/data/db_config.json` (Docker) или корень проекта (PM2).

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | HTTP-порт | `3000` / `8080` в Docker |
| `NODE_ENV` | `production` / `development` | — |
| `DB_ENCRYPTION_KEY` | Ключ AES-256 | **Обязательно сменить** |
| `STACK_DATA_DIR` | Каталог данных | `/app/data` в Docker |
| `DB_HOST_GATEWAY` | Алиас хоста для СУБД | `host.docker.internal` |
| `GITHUB_UPDATE_REPO` | Репозиторий обновлений | `llDecsterll/uvwstack` |
| `STACK_DEFAULT_DB_*` | Автоподключение при старте | см. `.env.example` |

Пример `.env`:

```env
PORT=8080
NODE_ENV=production
DB_ENCRYPTION_KEY=длинный-случайный-секрет
STACK_DATA_DIR=/app/data
GITHUB_UPDATE_REPO=https://github.com/llDecsterll/uvwstack.git
```

---

## Структура проекта

```text
uvwstack/
├── src/                         # React-интерфейс
├── server.ts                    # Express API, СУБД, шифрование
├── Dockerfile
├── docker-compose.yml           # Только приложение
├── docker-compose.mysql.yml     # + MySQL
├── docker-compose.postgres.yml  # + PostgreSQL
├── docker-compose.host.yml      # Host-сеть
├── scripts/verify-flow.mjs      # Smoke-тесты
├── README.md / README.ru.md / README.zh-CN.md
├── DOCKER.md
├── COPYRIGHT.md
└── .env.example
```

---

## Лицензирование

- **30 дней** ознакомительного периода с первого запуска
- Аппаратная привязка через код запроса: `REQ-XXXX-XXXX-XXXX-CHKS`
- Формат ключа: `UTKIN-{payload}-{hash}`
- Ключи выдаются отдельным **keyserver** (не входит в этот репозиторий)
- Генерация ключей в клиенте невозможна

Коммерческая лицензия: assetorbit@icloud.com

---

## Обновление

### Docker

```bash
cd uvwstack
git pull
docker compose down
docker compose up -d --build
```

Или через **Настройки → Центр обновлений** в интерфейсе.

### PM2

```bash
git pull && npm install && npm run build
pm2 restart uvwstack
```

---

## Устранение неполадок

| Проблема | Решение |
|----------|---------|
| **Connection refused из Docker** | Хост `172.17.0.1` или `docker-compose.host.yml`; MySQL: `bind-address=0.0.0.0` |
| **Ошибка при тесте с сохранённым паролем** | Исправлено с v2.6.4 — оставьте поле пароля пустым или введите заново |
| **Dockerfile не найден** | Запускайте compose из корня репозитория `~/uvwstack` |
| **Порт 8080 занят** | Измените `PORT` в `.env` и маппинг портов в compose |
| **Сборка падает по памяти** | В Dockerfile уже `SKIP_OBFUSCATION=true` |

Логи:

```bash
docker compose logs -f uvwstack-app
```

Проверка шлюза Docker:

```bash
ip addr show docker0 | grep inet
# Обычно: 172.17.0.1
```

Smoke-тесты:

```bash
npm install && npm run build && PORT=8098 node dist/server.cjs &
node scripts/verify-flow.mjs http://127.0.0.1:8098
```

---

## Авторское право и контакты

© 2026 **Уткин Владислав Вячеславович** (Utkin Vladislav Vyacheslavovich). Все права защищены.

Подробности: [COPYRIGHT.md](./COPYRIGHT.md)

| | |
|---|---|
| E-mail | assetorbit@icloud.com |
| Telegram | [@Dexterll](https://t.me/Dexterll) |
| GitHub | [llDecsterll/uvwstack](https://github.com/llDecsterll/uvwstack) |

Если Stack полезен — поставьте ⭐ репозиторию и сообщайте об ошибках через GitHub Issues.

---

<p align="center">Сделано для эффективного управления IT-инфраструктурой</p>
