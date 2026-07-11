# Vicariustab — полный индекс файлов

**Версия:** 2.0.21 · **Обновлено:** 11.07.2026  
**Репозиторий:** https://github.com/llDecsterll/vicariustab

---

## Сводка

| Раздел | Кол-во | Путь |
|--------|--------|------|
| React-компоненты | 43 | `src/components/` |
| Утилиты клиента | 47 | `src/utils/` |
| Ядро + config + legal | 9 | `src/` |
| Backend-модули | 26 TS | `server/` |
| Seed данных | 1 JSON | `server/workspaceSeed.json` |
| Audit / unit тесты | 18 suite | `scripts/audit-tests/` |
| Скрипты сборки и QA | 10 | `scripts/` |
| Docker / deploy | 12 | корень + `deploy/` |
| Документация | 9 MD | корень + `docs/` |
| Скриншоты UI | 27 PNG | `docs/screenshots/{ru,en,zh}/` |

**Стек:** React 19, TypeScript 5.8, Vite 6, Tailwind 4, Express 4, MySQL2 / pg (optional), Ed25519 license, TOTP 2FA, HttpOnly session cookie.

**Тесты:** `test:unit` 149 · `test:audit` ~172 · `browser:qa` 17 вкладок · i18n 1703 ключа

---

## Корень проекта

| Файл | Назначение |
|------|------------|
| `package.json` | Зависимости, npm scripts |
| `package-lock.json` | Lockfile |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite build, code-splitting, obfuscator |
| `index.html` | SPA entry |
| `server.ts` | Express API, auth, data, backup, update |
| `.env.example` | Шаблон env (без секретов) |
| `.gitignore` | Исключения git |
| `.dockerignore` | Исключения Docker build |
| `Dockerfile` | Production image |
| `docker-compose*.yml` | JSON / MySQL / Postgres / SSL / Caddy / host |
| `Caddyfile` | Reverse proxy + TLS |
| `nginx.conf`, `nginx.ssl.conf` | Nginx примеры |
| `run-docker.sh` | Быстрый запуск Docker |
| `deploy/ecosystem.config.cjs` | PM2 |
| `deploy/nginx-https.example.conf` | Nginx HTTPS пример |
| `README.md`, `README.ru.md`, `README.zh-CN.md` | Документация RU/EN/ZH |
| `CHANGELOG.md` | История версий |
| `RELEASE.md` | Release notes |
| `INSTALL-VARIANTS.md` | Варианты установки |
| `docs/VERIFICATION_PLAN.ru.md` | План полной проверки функционала |
| `DOCKER.md` | Docker guide |
| `COPYRIGHT.md`, `LICENSE` | Авторские права |

### Локальные данные (не в git)

| Файл | Назначение |
|------|------------|
| `.env` | `PORT`, `DB_ENCRYPTION_KEY`, `STACK_DATA_DIR` |
| `db.json` | Зашифрованная БД workspace |
| `store_meta.json` | Ревизия данных |
| `sessions_store.enc` | Зашифрованные сессии |
| `db_config.json` | MySQL/PostgreSQL config |

---

## `src/` — клиент

### Ядро

| Файл | Назначение |
|------|------------|
| `App.tsx` | Глобальный state, CRUD, autosave, routing вкладок |
| `main.tsx` | React mount |
| `types.ts` | TypeScript типы домена |
| `index.css` | Tailwind / global styles |
| `initialData.ts` | Legacy initial constants |
| `emptyWorkspace.ts` | Пустой workspace после purge |

### `src/config/`

| Файл | Назначение |
|------|------------|
| `appConfig.ts` | Версия, repo URL |
| `updateRepo.ts` | GitHub update repo config |

### `src/legal/`

| Файл | Назначение |
|------|------------|
| `copyright.ts` | Copyright strings |

### `src/components/` — 43 view / UI

| Файл | Вкладка / роль |
|------|----------------|
| `Sidebar.tsx` | Навигация (дашборд, активы, сервис) |
| `Header.tsx` | Поиск, уведомления, смена пользователя |
| `LoginScreen.tsx` | Экран входа + 2FA challenge |
| `FirstRunSetup.tsx` | Первичная настройка admin |
| `DashboardView.tsx` | Дашборд |
| `DashboardGridLayout.tsx` | Drag/resize grid виджетов |
| `DashboardWidgetScaler.tsx` | Масштаб виджетов xs–xl |
| `DashboardLayoutContext.tsx` | React context layout |
| `ComputersView.tsx` | Компьютеры |
| `NetworkView.tsx` | Сетевое оборудование |
| `WarehouseView.tsx` | Склад IT (приёмка, split, Excel) |
| `SoftwareView.tsx` | ПО и лицензии |
| `EmployeesView.tsx` | Сотрудники |
| `ObjectsView.tsx` | Объекты |
| `ReportsView.tsx` | Отчёты |
| `AuditsView.tsx` | Инвентаризация |
| `WarrantiesView.tsx` | Гарантия и обслуживание |
| `ActivityLogView.tsx` | Журнал действий |
| `SettingsView.tsx` | Настройки, БД, backup, лицензия |
| `TwoFactorSettings.tsx` | TOTP 2FA UI |
| `ActiveSessionsPanel.tsx` | Активные сессии |
| `UserPreferencesProvider.tsx` | Per-user preferences |
| `DetailModal.tsx` | Карточка оборудования |
| `ActEditorModal.tsx` | Редактор акта списания |
| `ActPrintContent.tsx` | Печать акта |
| `ConfirmDeleteModal.tsx` | Подтверждение удаления |
| `ConfirmReturnModal.tsx` | Подтверждение возврата |
| `DocumentHeader.tsx` | Шапка документов |
| `DocumentHeaderSettings.tsx` | Настройка шапки |
| `DocumentPrintShell.tsx` | Оболочка печати |
| `DocStampSeal.tsx` | Печать / штамп |
| `PdfPreviewModal.tsx` | PDF preview |
| `AuditChecklistFullscreen.tsx` | Fullscreen чеклист аудита |
| `AuditStartPrintDocument.tsx` | Печать старта аудита |
| `ComponentReplacementSection.tsx` | Замена компонентов |
| `EquipmentGroupFilters.tsx` | Фильтры групп оборудования |
| `EquipmentPhotoFrame.tsx` | Фото оборудования |
| `BrandLogo.tsx` | Логотип VT |
| `CopyrightFooter.tsx` | Footer copyright |
| `CountryFlag.tsx` | Флаги стран |
| `ImageLightbox.tsx` | Lightbox изображений |
| `ModalCloseButton.tsx` | Кнопка закрытия модалки |
| `ThemeModePicker.tsx` | Тёмная / светлая тема |

### `src/utils/` — 47 модулей

| Файл | Назначение |
|------|------------|
| `i18n.tsx` | RU / EN / ZH — 1703 ключа |
| `license.ts` | Trial, activate/deactivate, MAC binding |
| `licenseCryptoClient.ts` | Client-side Ed25519 verify |
| `sessionAuth.ts` | Login, TOTP, logout, heartbeat API |
| `memoryStorage.ts` | In-memory session cache (no browser persistence) |
| `deviceFingerprint.ts` | Device FP, HttpOnly session (credentials) |
| `apiClient.ts` | Authenticated fetch wrapper |
| `setupAuth.ts` | First-run setup API |
| `workspaceSync.ts` | POST /api/data, purge workspace |
| `userPreferences.ts` | PATCH /api/user/preferences |
| `updateCheck.ts` | GitHub update check / apply |
| `warehouseLifecycleEngine.ts` | Lifecycle simulator (31 subtype) |
| `warehouseExcel.ts` | Excel import/export склада |
| `warehouseRouting.ts` | Маршрутизация вкладок склада |
| `warehousePendingMerge.ts` | Merge pending write-off lines |
| `equipmentFields.ts` | Inv numbers, serials, batch suffix |
| `equipmentDelete.ts` | Delete equipment cards |
| `markPendingWriteOff.ts` | Mark for write-off |
| `cancelPendingWriteOff.ts` | Cancel pending write-off |
| `restoreWriteOff.ts` | Restore from write-off act |
| `backupLicensePolicy.ts` | Strip license from backups |
| `dashboardLayout.ts` | Grid breakpoints, layout |
| `dashboardGridMetrics.ts` | Widget move/resize metrics |
| `dashboardAnalytics.ts` | Dashboard KPI calculations |
| `dashboardAnimation.ts` | Dashboard motion |
| `dashboardI18n.ts` | Dashboard i18n helpers |
| `reportAnalytics.ts` | Reports analytics |
| `auditInventory.ts` | Inventory audit helpers |
| `auditDocuments.ts` | Audit document generation |
| `actDraft.ts` | Write-off act draft (memStorage) |
| `documentHeader.ts` | Document header state |
| `printDocument.ts` | Print orchestration |
| `printStyles.ts` | Print CSS |
| `printSanitize.ts` | Sanitize print HTML |
| `docStatus.ts` | Document status helpers |
| `softwareLicenseUtils.ts` | Software license helpers |
| `componentReplacementTemplates.ts` | Replacement templates |
| `credentialValidation.ts` | Login/password validation |
| `authErrors.ts` | Auth error messages |
| `localeRuntime.ts` | Runtime locale / security text |
| `personName.ts` | Person name formatting |
| `currencyUtils.ts` | Currency formatting |
| `imageUtils.ts` | Image resize / base64 |
| `clipboard.ts` | Copy to clipboard |
| `theme.ts` | Theme tokens |
| `ThemeProvider.tsx` | Theme React context |
| `useMediaQuery.ts` | Responsive hook |
| `deviceIcons.tsx` | Equipment tab icons |

---

## `server/` — backend (24 TS + seed)

| Файл | Назначение |
|------|------------|
| `apiAuth.ts` | Session middleware, RBAC, license gates |
| `apiRateLimit.ts` | IP throttling for `/api` (read/write limits) |
| `idempotency.ts` | Idempotency-Key replay for mutating requests |
| `sessionCookie.ts` | HttpOnly cookie `vt_session` |
| `sessionEngine.ts` | Sessions store, login, revoke |
| `dataStore.ts` | db.json / SQL load-save, revision |
| `userCredentials.ts` | Users, setup, sanitize for client |
| `userPreferences.ts` | Per-user preferences merge |
| `passwordHash.ts` | bcrypt hash, validation |
| `loginRateLimit.ts` | Brute-force protection |
| `licenseCore.ts` | Trial / activated license evaluate |
| `licenseInstallFields.ts` | preserve + redact license_key |
| `licenseCrypto.ts` | Ed25519 sign/verify |
| `licenseKeyFormat.ts` | UTKIN key format |
| `licensePublicKey.ts` | Embedded public key (in git) |
| `backupLicensePolicy.ts` | Backup whitelist |
| `totpEngine.ts` | TOTP generate/verify |
| `totpUserOps.ts` | TOTP setup/confirm/disable |
| `totpPendingSetup.ts` | In-memory pending TOTP secret |
| `totpPendingLogin.ts` | 2FA login challenge |
| `defaultWorkspaceSeed.ts` | First-run workspace seed |
| `workspaceValidation.ts` | Payload validation (dup inv, admin) |
| `workspaceWarehouses.ts` | Default warehouses heal |
| `purgeWorkspace.ts` | Purge workspace (keep users/license) |
| `notificationDispatch.ts` | Email / Telegram alerts |
| `githubUpdateCheck.ts` | GitHub release / package.json version |
| `updateEngine.ts` | In-app git pull update |
| `workspaceSeed.json` | Demo seed для first-run setup |

---

## `scripts/` — утилиты

| Файл | Команда | Назначение |
|------|---------|------------|
| `dev-server.mjs` | `npm run dev` | Dev mode (tsx + Vite) |
| `check-i18n.mjs` | `npm run check:i18n` | Проверка i18n ключей |
| `verify-flow.mjs` | `npm run verify` | E2E smoke (license, auth) |
| `verify-install.mjs` | `npm run verify:install` | Clean install gates |
| `browser-qa.mjs` | `npm run browser:qa` | Puppeteer tab smoke |
| `capture-screenshots.mjs` | `npm run screenshots` | UI screenshots RU/EN/ZH |
| `generate-license-keypair.mjs` | `npm run license:keypair` | Ed25519 keypair |
| `sync-license-public-from-pem.mjs` | `npm run license:sync-public` | PEM → licensePublicKey.ts |
| `setup-domain.mjs` | `npm run setup:domain` | Domain / public URL setup |
| `setup-domain.sh` | — | Shell wrapper setup-domain |

---

## `scripts/audit-tests/` — 18 suite

| Файл | Тип | Покрытие |
|------|-----|----------|
| `run-all.mjs` | runner | Полный audit suite |
| `auditAuth.mjs` | helper | Login + HttpOnly cookie parse |
| `unit-equipment.mjs` | unit | Inv numbers, serials, batch |
| `unit-lifecycle.mjs` | unit | Warehouse lifecycle helpers |
| `unit-validation.mjs` | unit | Workspace validation |
| `unit-warehouse-excel.mjs` | unit | Excel import/export |
| `unit-writeoff.mjs` | unit | Write-off partial/full |
| `unit-restore-writeoff.mjs` | unit | Restore from act |
| `unit-sql-persistence.mjs` | unit | SQL mock round-trip |
| `unit-warehouse-full-lifecycle.mjs` | unit | 31 subtype × 100 units |
| `unit-routing.mjs` | unit | Tab routing |
| `unit-backup-license.mjs` | unit | Backup license strip |
| `unit-license-server.mjs` | unit | Ed25519 license server |
| `unit-license-install.mjs` | unit | Redact + preserve license |
| `unit-totp.mjs` | unit | TOTP engine |
| `integration-api.mjs` | integration | Auth, dup inv, viewer 403 |
| `integration-db-settings.mjs` | integration | DB config, roles |
| `integration-totp.mjs` | integration | 2FA full flow |
| `load-concurrent.mjs` | integration | Concurrent saves |
| `security.mjs` | integration | Rate limit, auth gates |

**Unit-only (package.json `test:unit`):** writeoff, restore, routing, license-server, warehouse-full-lifecycle, lifecycle, totp, equipment, validation, backup-license → **149 tests**.

---

## API (основные маршруты)

| Method | Path | Auth | Назначение |
|--------|------|------|------------|
| GET | `/api/health` | — | Health + version |
| GET | `/api/auth/setup-status` | — | First-run check |
| POST | `/api/auth/setup` | — | Create first admin |
| POST | `/api/auth/authenticate` | — | Login (+ 2FA challenge) |
| POST | `/api/auth/authenticate/totp` | — | TOTP step 2 |
| GET | `/api/auth/session` | cookie | Current session info |
| POST | `/api/auth/logout` | cookie | Logout + clear cookie |
| GET/POST | `/api/data` | ✓ | Workspace read/write |
| POST | `/api/data/purge-workspace` | Admin | Purge inventory |
| GET | `/api/backup/export` | Admin + license | .enc backup |
| POST | `/api/backup/import` | Admin + license | Restore backup |
| GET/POST | `/api/db-config` | Admin | SQL settings |
| GET | `/api/update/check` | ✓ | GitHub update metadata |
| POST | `/api/update/apply` | Admin + license | Apply update |
| GET/POST | `/api/auth/totp/*` | ✓ | TOTP setup/status |

**Сессия:** HttpOnly cookie `vt_session` (SameSite=Strict, Secure на HTTPS). Header `X-Session-Token` — только для audit/integration.

---

## npm scripts

```bash
npm run dev              # Dev server (:8098 из .env)
npm run build && npm start   # Production :8080
npm run lint             # tsc --noEmit
npm run check:i18n       # 1703 keys RU/EN/ZH
npm run test:unit        # 149 unit
npm run test:audit       # ~172 (нужен сервер)
npm run test:all         # audit + verify
npm run verify           # Smoke E2E
npm run verify:install   # Install gates
npm run browser:qa       # Puppeteer 17 tabs
```

---

## Cursor rules (локально)

| Файл | Назначение |
|------|------------|
| `.cursor/rules/project-index.mdc` | Быстрый индекс модулей |
| `.cursor/rules/files-map.mdc` | Карта файлов + counts |

---

## Не индексировать / не публиковать

`node_modules/`, `dist/`, `.env`, `db.json`, `sessions_store.enc`, `*.pem`, `db.json.before-fresh-*.bak`, `.browser-qa-data/`
