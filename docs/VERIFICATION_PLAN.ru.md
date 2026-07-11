# Vicariustab — план полной проверки функционала

**Версия продукта:** 2.0.21  
**Обновлено:** 11.07.2026  
**Назначение:** регрессионная проверка всего product перед релизом / после крупных изменений.

---

## Принципы

| Правило | Ожидание |
|---------|----------|
| Источник данных | Только сервер (`db.json` / MySQL / PostgreSQL). Браузер — in-memory на время сессии |
| Сессия | HttpOnly cookie `vt_session`, без токена в `localStorage` |
| Лицензия | Активация админом → `db.json` → все пользователи видят статус после sync |
| Роли | Admin / Editor / Viewer — права на API и UI |
| Резервные копии | JSON v3.0 с сервера + `.enc` через `/api/backup` (без ключа) |

---

## Фаза 0 — Подготовка окружения

```bash
cd product
cp .env.example .env
# Задать DB_ENCRYPTION_KEY (длинная случайная строка)
npm install
npm run build
```

Изолированный сервер для audit (не мешать dev):

```powershell
$env:PORT='8175'
$env:STACK_DATA_DIR='d:\Cursorbase\product\.audit-run-data'
$env:DB_ENCRYPTION_KEY='audit-test-key-32chars-minimum!!'
$env:API_RATE_LIMIT_WRITE_MAX='1000'
$env:API_RATE_LIMIT_READ_MAX='5000'
node dist/server.cjs
```

Проверка: `curl http://127.0.0.1:8175/api/health`

---

## Фаза A — Статический контроль (без UI)

| # | Команда | Критерий успеха |
|---|---------|-----------------|
| A1 | `npm run lint` | exit 0 |
| A2 | `npm run check:i18n` | 0 missing keys |
| A3 | `npm run build` | dist/ + dist/server.cjs |
| A4 | `npm run test:unit` | все suite pass |
| A5 | `AUDIT_BASE_URL=http://127.0.0.1:8175 npm run test:audit` | `ALL AUDIT TESTS PASSED` |
| A6 | `npm run verify http://127.0.0.1:8175` | license/auth/update helpers OK |
| A7 | `npm run verify:install http://127.0.0.1:8175` | `INSTALL CHECKS PASSED` |

---

## Фаза B — Установка и первый запуск

| # | Сценарий | Шаги | Ожидание |
|---|----------|------|----------|
| B1 | Чистая установка | Удалить `db.json`, `store_meta.json`, `sessions_store.enc`, `db_config.json` в `STACK_DATA_DIR`; перезапуск | `GET /api/auth/setup-status` → `setupRequired: true` |
| B2 | FirstRunSetup | Создать admin (логин ≥3, пароль ≥8, email) | Редirect на LoginScreen |
| B3 | Вход | Логин/пароль | HttpOnly cookie, экран «Загрузка данных с сервера…», затем дашборд |
| B4 | Seed-данные | После входа | Объекты, сотрудники, склад, ПО из `workspaceSeed.json` |
| B5 | Нет demo-логинов | Попытка `admin/admin` | 401 |
| B6 | Docker JSON | `docker compose up -d --build` | :8080, том `vicariustab_data` |
| B7 | Docker+MySQL | `docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d --build` | Автоподключение через `STACK_DEFAULT_DB_*` |
| B8 | Docker+Postgres | `docker compose -f ...postgres.yml ...` | Аналогично |
| B9 | Host-сеть | `docker-compose.host.yml` | Хост `localhost` в UI СУБД |
| B10 | PM2 | `pm2 start deploy/ecosystem.config.cjs --env production` | :8080 из `.env` |

---

## Фаза C — Аутентификация и сессии

| # | Проверка | Ожидание |
|---|----------|----------|
| C1 | `POST /api/auth/authenticate` | 200 + Set-Cookie `vt_session` |
| C2 | `GET /api/auth/session` с cookie | userId, без token в JSON |
| C3 | Logout | Cookie cleared |
| C4 | TOTP (если включён) | setup-begin → enable → login с кодом |
| C5 | Rate limit login | 10+ неверных попыток → 429 |
| C6 | Viewer блокировка | Заблокированный user → logout |
| C7 | Active sessions panel | Список с сервера, текущая сессия в sessionStorage (только id) |

---

## Фаза D — Данные workspace (CRUD + sync)

Проверить под **Admin**, **Editor**, **Viewer**:

| Модуль | Create | Read | Update | Delete | Sync 30s |
|--------|--------|------|--------|--------|----------|
| Объекты | ✓ | ✓ | ✓ | ✓ | второй браузер видит изменения |
| Компьютеры | ✓ | ✓ | ✓ | ✓ | |
| Сеть | ✓ | ✓ | ✓ | ✓ | |
| Сотрудники | ✓ | ✓ | ✓ | ✓ | |
| Склад (приход/выдача/списание) | ✓ | ✓ | ✓ | ✓ | |
| ПО | ✓ | ✓ | ✓ | ✓ | |
| Аудиты | ✓ | ✓ | ✓ | ✓ | |
| Журнал активности | — | ✓ | — | clear (admin) | |
| Гарантии | ✓ | ✓ | ✓ | ✓ | |
| Отчёты | — | ✓ | export | — | |

Дополнительно:

- D-REV: два Editor сохраняют одновременно → 409 + reload актуальных данных
- D-IDEM: повтор POST с тем же `Idempotency-Key` → тот же ответ
- D-RL: >240 GET/min с IP → 429 `API_RATE_LIMITED`

---

## Фаза E — Настройки (Settings)

### E1 — Общие

| Функция | UI | API / поведение |
|---------|-----|-----------------|
| Название workspace | Настройки → Общие | POST `/api/data`, sync всем |
| Admin email, public URL | | |
| Логотип, favicon, цвета sidebar | | |
| Шапка документов | | `documentHeader` в payload |
| Язык интерфейса | | `/api/user/preferences` (per user) |
| Layout дашборда | | preferences.dashboardLayout |

### E2 — Пользователи

| Функция | Admin | Editor | Viewer |
|---------|-------|--------|--------|
| Добавить пользователя | ✓ | ✗ | ✗ |
| Сменить роль/пароль | ✓ | ✗ | ✗ |
| TOTP для user | ✓ | — | — |
| Аватар | ✓ | own | own |

### E3 — Лицензия

| Функция | Ожидание |
|---------|----------|
| Активация ключа (Admin) | Ключ в `db.json`, все пользователи — licensed после reload/sync |
| Request code | REQ-… по MAC установки |
| Trial 30 дней | Без ключа, countdown |
| Excel / backup / update | Только после активации |
| Деактивация | Ключ снят на сервере |

### E4 — Резервное копирование (два типа)

| Тип | UI | Формат | Лицензия |
|-----|-----|--------|----------|
| Платформенный JSON | «Создать резервную копию» | `backupVersion: 3.0`, data = workspace с сервера | исключена |
| Зашифрованный .enc | «Скачать копию» | `/api/backup/export` AES-256 | исключена |
| Восстановление JSON | Upload v3.0 | POST `/api/data` | ключ не импортируется |
| Восстановление .enc | `/api/backup/import` | | |

### E5 — Центр обновлений

| Функция | Ожидание |
|---------|----------|
| Проверка GitHub | `GET /api/update/check` |
| Кнопка «Установить обновление» | `POST /api/update/apply` (только Admin + license) |
| Логи job | `/api/update/status` polling |
| `STACK_DISABLE_AUTO_UPDATE=true` | авто-проверка отключена |
| PM2 / Docker | git pull + rebuild (см. README) |

### E6 — Параметры СУБД (MySQL / PostgreSQL)

| Функция | UI | API |
|---------|-----|-----|
| Тест соединения | «Проверить соединение» | `POST /api/db-config/test` |
| Сохранить и мигрировать | «Применить СУБД и мигрировать» | `POST /api/db-config` |
| Статус | индикатор | `GET /api/db-status` |
| Пароль маскируется | GET `/api/db-config` | `***` |
| JSON fallback | type=json | работает без SQL |

### E7 — Очистка workspace

| Функция | Ожидание |
|---------|----------|
| Purge inventory | `POST /api/data/purge-workspace` — users/license/UI сохранены |

---

## Фаза F — Склад (углублённо)

Прогнать сценарии из `unit-warehouse-full-lifecycle` вручную в UI:

1. Приход 100 ед. → split → deploy → write-off (31 subtype)
2. Partial write-off → cancel pending → return to warehouse
3. Excel import/export (licensed)
4. Дубли инв. № → auto-repair / validation error

---

## Фаза G — Browser QA

```bash
npm run browser:qa
```

17/17 сценариев (login, tabs, warehouse, settings smoke).

---

## Фаза H — Безопасность

| # | Проверка |
|---|----------|
| H1 | `/api/data` без auth → 401 |
| H2 | Viewer POST → 403 |
| H3 | SQLi в login → не crash |
| H4 | Backup export → нет `license_key` |
| H5 | `localStorage` после работы — нет `it_*` ключей (DevTools) |
| H6 | Security headers / cookie flags (Secure на HTTPS) |

---

## Фаза I — Docker / домен / HTTPS

| # | Команда | Проверка |
|---|---------|----------|
| I1 | `npm run setup:domain` (или `--check-only`) | DNS, .env, порты |
| I2 | `docker-compose.caddy.yml` | HTTPS Let's Encrypt |
| I3 | `TRUST_PROXY=true` за reverse proxy | корректный client IP для rate limit |

---

## Матрица «README ↔ код»

| README раздел | Актуальный UI / код | Статус |
|---------------|---------------------|--------|
| Версия 2.0.21 | `appConfig.ts` | синхронизировать badge |
| Настройки → «Параметры СУБД» | SettingsView tab | ✓ |
| Центр обновлений | SettingsView + updateEngine | ✓ |
| Backup JSON v3.0 | SettingsView handleCreateBackup | ✓ |
| Backup .enc | `/api/backup/export` | ✓ |
| Данные только на сервере | memoryStorage + poll 30s | ✓ (README обновлён) |
| `npm run test:audit` | `ALL AUDIT TESTS PASSED` | ✓ |
| API rate limit / idempotency | apiRateLimit.ts, idempotency.ts | ✓ (README env) |

---

## Критерий GO / NO-GO

**GO** если:

- Фазы A + B + G — без ошибок
- Фаза D — все модули сохраняют на сервер и sync
- E4, E5, E6 — backup/update/DB работают под Admin
- H5 — нет persistent data в browser storage

**NO-GO** — любой blocker в auth, save, license, DB migrate, update apply.

---

## Быстрый чеклист (1 команда)

```bash
npm run lint && npm run check:i18n && npm run test:unit && npm run build && npm run test:audit && npm run verify && npm run browser:qa
```

(Сервер должен быть запущен на `AUDIT_BASE_URL`, по умолчанию :8098.)
