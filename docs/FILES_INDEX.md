# Vicariustab — полный индекс файлов (v2.0.21)

**Repo:** https://github.com/llDecsterll/vicariustab  
**Обновлено:** 03.07.2026

Навигация для разработчиков и AI-агентов. Runtime-артефакты (`node_modules/`, `dist/`, `db.json`, `sessions_store.enc`) не перечислены.

---

## Корень `product/`

| Файл | Назначение |
|------|------------|
| `server.ts` | Express entry: API, static, SPA, backup, update |
| `package.json` | Зависимости, npm scripts, version |
| `vite.config.ts` | Vite build, chunks, obfuscation |
| `tsconfig.json` | TypeScript config |
| `.env.example` | Шаблон env (DB_ENCRYPTION_KEY и др.) |
| `docker-compose*.yml` | Docker: default, MySQL, Postgres, Caddy, SSL, host |
| `deploy/ecosystem.config.cjs` | PM2 production |
| `deploy/nginx-https.example.conf` | Пример reverse proxy |
| `AGENTS.md` | Краткий индекс для агентов |
| `README.md` / `README.ru.md` / `README.zh-CN.md` | Документация |
| `CHANGELOG.md` | История версий |
| `RELEASE.md` | Процесс релиза |
| `DOCKER.md` | Docker-установка |
| `INSTALL-VARIANTS.md` | Варианты установки |
| `COPYRIGHT.md` | Авторские права |

---

## `src/` — клиент

### Ядро

| Файл | Назначение |
|------|------------|
| `main.tsx` | React mount |
| `App.tsx` | State, sync, CRUD, equipment lifecycle, tabs |
| `types.ts` | Доменные типы (objects, computers, warehouse, users…) |
| `initialData.ts` | Seed из `workspaceSeed.json` |
| `emptyWorkspace.ts` | Пустой workspace (purge client) |
| `index.css` | Глобальные стили |
| `config/appConfig.ts` | `APP_VERSION`, update repo URL |
| `config/updateRepo.ts` | URL репозитория GitHub |
| `legal/copyright.ts` | Copyright strings |

### `src/components/` (42 файла)

| Файл | Назначение |
|------|------------|
| `Sidebar.tsx` | Навигация, trial badge |
| `Header.tsx` | Верхняя панель |
| `DashboardView.tsx` | KPI, графики, draggable layout |
| `DashboardGridLayout.tsx` | Responsive grid, drag/resize виджетов |
| `DashboardWidgetScaler.tsx` | Масштабирование виджетов по tier (xs–xl) |
| `DashboardLayoutContext.tsx` | Context раскладки дашборда |
| `ObjectsView.tsx` | Объекты/локации |
| `ComputersView.tsx` | ПК, периферия, оргтехника, видео, расходники, другое |
| `NetworkView.tsx` | Сетевое оборудование |
| `SoftwareView.tsx` | Лицензии ПО |
| `WarehouseView.tsx` | Склад, списание, Excel, split, склады |
| `EmployeesView.tsx` | Сотрудники |
| `AuditsView.tsx` | Инвентаризация |
| `WarrantiesView.tsx` | Гарантии |
| `ReportsView.tsx` | Отчёты |
| `ActivityLogView.tsx` | Журнал действий |
| `SecurityView.tsx` | Аудит ИБ |
| `SettingsView.tsx` | Users, backup, update, DB, license, branding |
| `DetailModal.tsx` | Карточка оборудования |
| `ConfirmDeleteModal.tsx` | Подтверждение удаления |
| `ConfirmReturnModal.tsx` | Возврат на склад |
| `LoginScreen.tsx` | Вход |
| `FirstRunSetup.tsx` | Первичная настройка admin |
| `ActiveSessionsPanel.tsx` | Сессии |
| `DocumentHeader.tsx` | Шапка документов |
| `DocumentHeaderSettings.tsx` | Настройка шапки |
| `DocumentPrintShell.tsx` | Оболочка печати |
| `ActPrintContent.tsx` | Печать акта |
| `ActEditorModal.tsx` | Редактор акта |
| `AuditStartPrintDocument.tsx` | Печать начала инвентаризации |
| `AuditChecklistFullscreen.tsx` | Чеклист инвентаризации |
| `DocStampSeal.tsx` | Печать/штамп |
| `PdfPreviewModal.tsx` | Превью PDF |
| `EquipmentPhotoFrame.tsx` | Фото оборудования |
| `ImageLightbox.tsx` | Просмотр изображений |
| `EquipmentGroupFilters.tsx` | Фильтры групп |
| `ComponentReplacementSection.tsx` | Замена комплектующих |
| `ThemeModePicker.tsx` | Светлая/тёмная тема |
| `CountryFlag.tsx` | Флаги языков |
| `BrandLogo.tsx` | Логотип |
| `ModalCloseButton.tsx` | Кнопка закрытия модалки |
| `CopyrightFooter.tsx` | Футер |

### `src/utils/` (46 файлов)

| Файл | Назначение |
|------|------------|
| **Склад и оборудование** | |
| `equipmentFields.ts` | Inv/batch/SN, split `/рN`, allocate |
| `equipmentDelete.ts` | Каскад, preview, software links |
| `warehouseRouting.ts` | Тип→группа, `WAREHOUSE_TYPE_TAB`, dedup UI |
| `warehouseLifecycleEngine.ts` | Pure lifecycle simulator (31 subtype) |
| `markPendingWriteOff.ts` | Частичное «На списание» |
| `cancelPendingWriteOff.ts` | Отмена списания + restore computers |
| `restoreWriteOff.ts` | Восстановление из истории |
| `warehousePendingMerge.ts` | Merge siblings, repair duplicates |
| `warehouseExcel.ts` | XLSX import/export (`xlsx`) |
| **Лицензия и sync** | |
| `license.ts` | Trial, активация, `canUseBackup/Excel/Update` |
| `licenseCryptoClient.ts` | Ed25519 verify (client) |
| `softwareLicenseUtils.ts` | Утилиты лицензий ПО |
| `backupLicensePolicy.ts` | Strip license из backup |
| `workspaceSync.ts` | persist + revision retry |
| **Auth и API** | |
| `sessionAuth.ts` | login/logout/heartbeat |
| `apiClient.ts` | apiFetch |
| `setupAuth.ts` | First-run setup |
| `authErrors.ts` | Коды ошибок auth |
| `deviceFingerprint.ts` | Session token, headers |
| `credentialValidation.ts` | Валидация login/password |
| **UI и i18n** | |
| `i18n.tsx` | ru/en/zh (~1653 ключа) |
| `localeRuntime.ts` | interpolate, security text |
| `theme.ts` | Тема |
| `ThemeProvider.tsx` | React context темы |
| `useMediaQuery.ts` | Responsive hooks |
| `deviceIcons.tsx` | Иконки типов устройств |
| `clipboard.ts` | Copy to clipboard |
| **Печать и документы** | |
| `printDocument.ts` | Печать |
| `printStyles.ts` | CSS печати |
| `printSanitize.ts` | Санитизация HTML |
| `auditDocuments.ts` | Документы инвентаризации |
| `auditInventory.ts` | Логика аудита |
| `actDraft.ts` | Черновики актов |
| `documentHeader.ts` | Шапка документов |
| `docStatus.ts` | Статусы документов |
| **Дашборд и отчёты** | |
| `dashboardAnalytics.ts` | KPI, slices |
| `dashboardI18n.ts` | Переводы дашборда |
| `dashboardAnimation.ts` | Анимации |
| `dashboardLayout.ts` | Grid layout, responsive breakpoints |
| `dashboardGridMetrics.ts` | Grid metrics, move/resize, pixel mapping |
| `reportAnalytics.ts` | Аналитика отчётов |
| **Прочее** | |
| `updateCheck.ts` | GitHub update UI |
| `imageUtils.ts` | Изображения |
| `currencyUtils.ts` | Валюта |
| `personName.ts` | ФИО |
| `componentReplacementTemplates.ts` | Шаблоны замены |

---

## `server/` — бэкенд (19 модулей + seed)

| Файл | Назначение |
|------|------------|
| `dataStore.ts` | Workspace CRUD, revision, JSON/SQL |
| `apiAuth.ts` | Middleware: auth, roles, license gates |
| `sessionEngine.ts` | Сессии, heartbeat, revoke |
| `userCredentials.ts` | Пароли, setup, seed |
| `passwordHash.ts` | bcrypt/scrypt |
| `loginRateLimit.ts` | Brute-force 10/15min |
| `workspaceValidation.ts` | Inv uniqueness, admin guard |
| `workspaceWarehouses.ts` | Reconcile каталога складов |
| `purgeWorkspace.ts` | Purge inventory |
| `backupLicensePolicy.ts` | Strip license server-side |
| `licenseCore.ts` | `evaluateLicenseFromState` |
| `licenseCrypto.ts` | Ed25519 verify/sign |
| `licenseInstallFields.ts` | `preserveServerInstallLicenseFields` |
| `licenseKeyFormat.ts` | Parse UTKIN keys |
| `licensePublicKey.ts` | Public key (auto-generated) |
| `updateEngine.ts` | Apply GitHub update |
| `githubUpdateCheck.ts` | Check remote version |
| `notificationDispatch.ts` | Push сессиям |
| `defaultWorkspaceSeed.ts` | Seed loader |
| `workspaceSeed.json` | Demo data JSON |

---

## `scripts/`

| Файл | Назначение |
|------|------------|
| `dev-server.mjs` | Dev: Vite + Express |
| `check-i18n.mjs` | Проверка переводов |
| `verify-flow.mjs` | E2E smoke (нужен keyserver PEM) |
| `verify-install.mjs` | Проверка установки |
| `capture-screenshots.mjs` | Скриншоты README |
| `generate-license-keypair.mjs` | Ed25519 keypair |
| `sync-license-public-from-pem.mjs` | Синхронизация public key из PEM |
| `setup-domain.mjs` / `setup-domain.sh` | Настройка домена |
| `normalize-release.cjs` | Нормализация релиза |
| `apply-copyright-header.cjs` | Заголовки copyright |

### `scripts/audit-tests/` (15 suite + runner)

| Файл | Тестов | Покрытие |
|------|--------|----------|
| `unit-equipment.mjs` | 19 | inv, batch, merge, serials |
| `unit-lifecycle.mjs` | 11 | return, purge, stock line |
| `unit-validation.mjs` | 6 | workspaceValidation |
| `unit-warehouse-excel.mjs` | 5 | Excel import/export |
| `unit-writeoff.mjs` | 17 | partial write-off, cancel, restore |
| `unit-restore-writeoff.mjs` | 13 | restore from history |
| `unit-warehouse-full-lifecycle.mjs` | 63 | 31 subtype × 2 scenarios |
| `unit-routing.mjs` | 4 | группы оборудования |
| `unit-backup-license.mjs` | 4 | backup license strip |
| `unit-license-server.mjs` | 9 | Ed25519, evaluateLicense |
| `unit-license-install.mjs` | 2 | preserveServerInstallLicenseFields |
| `unit-sql-persistence.mjs` | 4 | SQL round-trip, key cleanup |
| `integration-api.mjs` | 5 | API + auth (needs server) |
| `security.mjs` | 3 | rate limit, 401 |
| `load-concurrent.mjs` | 1 | revision conflict |
| `run-all.mjs` | — | Runner всех suite |

**Итого:** ~164 теста (`npm run test:audit`). `test:unit` — 144 (2 skip без keyserver PEM). Integration/load требуют сервер на `:8098`.

---

## `docs/`

| Файл | Назначение |
|------|------------|
| `FILES_INDEX.md` | Этот файл — полный каталог |
| `RELEASE_AUDIT_v2.0.16.md` | Отчёт аудита релиза |
| `screenshots/{en,ru,zh}/` | Скриншоты для README |

---

## Cursor rules (индексация AI)

| Путь | Файл |
|------|------|
| Workspace root | `../FILES_INDEX.md` — весь Cursorbase + keyserver + skills |
| Workspace | `.cursor/rules/workspace-overview.mdc` |
| Workspace | `.cursor/rules/product-vicariustab.mdc` |
| Workspace | `.cursor/rules/equipment-lifecycle.mdc` |
| Workspace | `.cursor/rules/server-backend.mdc` |
| Workspace | `.cursor/rules/keyserver-local.mdc` — **локально, не в git** |
| Keyserver | `keyserver/LOCAL_INDEX.md` — **не публиковать** |
| Agent skills | `../.agents/AGENTS_INDEX.md` — 84 skills |
| Git repo | `product/.cursor/rules/project-index.mdc` |
| Git repo | `product/.cursor/rules/files-map.mdc` |

---

## License gates (v2.0.21)

| Функция | Client | Server |
|---------|--------|--------|
| Excel склад | `canUseWarehouseExcel` | — |
| Backup | `canUseBackup` | `requireActivatedLicense` |
| Update apply | `canUseSystemUpdate` | `requireActivatedLicense` |
| Write data | `checkLicenseBlocked` (expired) | `requireValidLicenseForWrite` |
| Install license | — | `preserveServerInstallLicenseFields` |

---

## npm scripts

`dev` · `build` · `start` · `lint` · `check:i18n` · `test:unit` (144) · `test:audit` (~164) · `test:all` · `verify` · `verify:install` · `screenshots` · `license:keypair` · `license:sync-public` · `setup:domain`
