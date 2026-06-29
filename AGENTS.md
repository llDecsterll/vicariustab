# Vicariustab — индекс проекта

**Версия:** 2.0.19 · **Repo:** https://github.com/llDecsterll/vicariustab

**Полный каталог файлов:** [`docs/FILES_INDEX.md`](docs/FILES_INDEX.md) · Workspace: [`../FILES_INDEX.md`](../FILES_INDEX.md)

> Keyserver (`../keyserver/`) — только локально, **не публиковать**. См. [`../keyserver/LOCAL_INDEX.md`](../keyserver/LOCAL_INDEX.md)

## Установка

```bash
git clone https://github.com/llDecsterll/vicariustab.git
cd vicariustab
cp .env.example .env   # DB_ENCRYPTION_KEY
npm install && npm run build
PORT=8080 npm start
```

Проверка:

```bash
npm run lint && npm run check:i18n
npm run test:unit      # 99 unit tests
npm run test:audit     # ~109 (npm start на :8098)
npm run verify http://127.0.0.1:8080
```

## Карта кодовой базы

| Область | Путь |
|---------|------|
| State + CRUD | `src/App.tsx` |
| Типы | `src/types.ts` |
| Склад UI | `src/components/WarehouseView.tsx` |
| Списание | `markPendingWriteOff.ts`, `cancelPendingWriteOff.ts`, `restoreWriteOff.ts`, `warehousePendingMerge.ts` |
| Excel | `warehouseExcel.ts` |
| Оборудование | `equipmentFields.ts`, `equipmentDelete.ts`, `warehouseRouting.ts` |
| Лицензия | `license.ts`, `server/licenseCore.ts` |
| Gated | `canUseWarehouseExcel`, `canUseBackup`, `canUseSystemUpdate`, `requireActivatedLicense` |
| Backup | `backupLicensePolicy.ts` (client + server) |
| Sync | `workspaceSync.ts` |
| Auth | `sessionAuth.ts`, `server/sessionEngine.ts`, `server/apiAuth.ts` |
| Data | `server/dataStore.ts` |
| Update | `updateEngine.ts`, `githubUpdateCheck.ts`, `updateCheck.ts` |
| Print | `printDocument.ts`, `ActPrintContent.tsx`, `DocumentPrintShell.tsx` |
| Dashboard | `DashboardView.tsx`, `dashboardAnalytics.ts` |
| Express | `server.ts` |

## UI tabs

`dashboard` · `objects` · `computers` · `network` · `peripherals` · `orgtech` · `surveillance` · `consumables` · `other_equip` · `employees` · `warehouse` · `software` · `inventory` · `warranties` · `reports` · `activity_log` · `security` · `settings`

## Audit tests

| Файл | Тестов |
|------|--------|
| unit-equipment.mjs | 8 |
| unit-lifecycle.mjs | 9 |
| unit-validation.mjs | 6 |
| unit-warehouse-excel.mjs | 5 |
| unit-writeoff.mjs | 16 |
| unit-restore-writeoff.mjs | 13 |
| unit-warehouse-full-lifecycle.mjs | 32 |
| unit-routing.mjs | 4 |
| unit-backup-license.mjs | 4 |
| unit-license-server.mjs | 7 |
| integration-api.mjs | 5 |
| security.mjs | 3 |
| load-concurrent.mjs | 1 |

**Итого:** ~109 автотестов (`npm run test:audit`). `test:unit` — 99 без сервера. Integration/load требуют сервер на `:8098`.

## Cursor rules

- `product/.cursor/rules/project-index.mdc`
- `product/.cursor/rules/files-map.mdc`
- `../.cursor/rules/` (workspace Cursorbase)

## Документация

| Файл | Содержание |
|------|------------|
| `docs/FILES_INDEX.md` | Полный индекс всех файлов |
| `docs/RELEASE_AUDIT_v2.0.16.md` | Аудит релиза |
| `docs/RELEASE_AUDIT_v2.0.16.md` | Аудит v2.0.16 |
