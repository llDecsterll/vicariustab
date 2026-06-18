# Release

**Uvwstack** v2.6.4 — дистрибутив для GitHub и Docker (Linux).

## Docker (только приложение)

```bash
git clone https://github.com/llDecsterll/uvwstack.git
cd uvwstack
cp .env.example .env
docker compose up -d --build
```

http://localhost:8080

## Docker + MySQL (рекомендуется)

```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build
```

В настройках СУБД: хост `mysql`, пользователь `stack_user`, БД `stack_db`.

## MySQL/PostgreSQL на Ubuntu (нативно, не в Docker)

Контейнер **не видит** `localhost` хоста. Варианты:

1. **Host-сеть** (проще всего, если СУБД слушает `127.0.0.1`):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
   ```
   В настройках СУБД укажите `localhost`.

2. **Bridge + IP шлюза** — хост `172.17.0.1` или `host.docker.internal`, в MySQL:
   - `bind-address = 0.0.0.0` в `/etc/mysql/mysql.conf.d/mysqld.cnf`
   - `CREATE USER 'stack'@'%' IDENTIFIED BY '...'; GRANT ALL ON stack_db.* TO 'stack'@'%';`

© 2026 Utkin Vladislav Vyacheslavovich · assetorbit@icloud.com
