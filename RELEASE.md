# Release v2.6.1

**Uvwstack** — release: исправлена Docker-сборка на Linux, оптимизация production-сервера.

## Что нового

- Добавлены `Dockerfile` и `.dockerignore` для сборки на Linux (`docker compose up -d --build`)
- Production-сервер больше не требует `vite` в runtime (динамический import только в dev)
- Обфuscation отключается при `SKIP_OBFUSCATION=true` (Docker/CI) — стабильная сборка на 1–2 GB RAM
- `docker-compose.yml` переименован в `uvwstack-app`, volume для данных
- Healthcheck на `/api/update/repo`

## Быстрый старт (Docker)

```bash
git clone https://github.com/llDecsterll/uvwstack.git
cd uvwstack
cp .env.example .env
# Задайте DB_ENCRYPTION_KEY в .env
docker compose up -d --build
```

Приложение: http://localhost:8080

## Версия

- **2.6.1** — release
- Репозиторий обновлений: https://github.com/llDecsterll/uvwstack

---

© 2026 Utkin Vladislav Vyacheslavovich · assetorbit@icloud.com
