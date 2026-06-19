# Release — варианты установки Vicariustab

Проверка API после запуска: `npm run verify:install http://127.0.0.1:8080`

| # | Вариант | Команда | БД |
|---|---------|---------|-----|
| 1 | Docker Compose (JSON) | `docker compose up -d --build` | Локальный `db.json` |
| 2 | Docker + MySQL | `docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build` | `mysql:3306` / `stack_db` |
| 3 | Docker + PostgreSQL | `docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --build` | `postgres:5432` / `stack_db` |
| 4 | Host-сеть + СУБД на Ubuntu | `docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build` | `127.0.0.1` MySQL/PostgreSQL |
| 5 | Нативно (PM2) | `npm install && npm run build && pm2 start deploy/ecosystem.config.cjs` | Настройки → СУБД или JSON |

## Подключение MySQL / PostgreSQL

Переменные `STACK_DEFAULT_DB_*` в `.env` (см. `.env.example`):

| Параметр | MySQL (вариант 2) | PostgreSQL (вариант 3) | Host (вариант 4) |
|----------|-------------------|-------------------------|------------------|
| `STACK_DEFAULT_DB_TYPE` | `mysql` | `postgres` | `mysql` или `postgres` |
| `STACK_DEFAULT_DB_HOST` | `mysql` | `postgres` | `127.0.0.1` |
| `STACK_DEFAULT_DB_PORT` | `3306` | `5432` | `3306` / `5432` |
| `STACK_DEFAULT_DB_NAME` | `stack_db` | `stack_db` | `stack_db` |
| `STACK_DEFAULT_DB_USER` | `stack_user` | `stack_user` | `stack_user` |
| `STACK_DEFAULT_DB_PASSWORD` | `MYSQL_PASSWORD` | `POSTGRES_PASSWORD` | свой пароль |

В UI: **Настройки → База данных** — тест и сохранение подключения.

## HTTPS + домен

```bash
STACK_DOMAIN=stack.example.com docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

С MySQL:

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml -f docker-compose.caddy.yml up -d --build
```
