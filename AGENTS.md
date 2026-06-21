# Vicariustab — индекс проекта

**Версия:** 2.0.7 · **Repo:** https://github.com/llDecsterll/vicariustab

## Установка (как в README)

```bash
git clone https://github.com/llDecsterll/vicariustab.git
cd vicariustab
cp .env.example .env   # задайте DB_ENCRYPTION_KEY
npm install
npm run build
PORT=8080 npm start    # или: docker compose up -d --build
```

Проверка:

```bash
npm run lint
npm run verify http://127.0.0.1:8080
npm run verify:install http://127.0.0.1:8080
```

## Карта кодовой базы

| Область | Путь |
|---------|------|
| State + CRUD + equipment | `src/App.tsx` |
| Типы | `src/types.ts` |
| Склад (unified TMZ) | `src/components/WarehouseView.tsx` |
| Удаление/возврат | `src/utils/equipmentDelete.ts`, `equipmentFields.ts`, `warehouseRouting.ts` |
| Модалки confirm | `ConfirmDeleteModal.tsx`, `ConfirmReturnModal.tsx` |
| Лицензия | `src/utils/license.ts`, `server/licenseCore.ts` |
| Sync + revision | `src/utils/workspaceSync.ts` |
| Auth/sessions | `src/utils/sessionAuth.ts`, `server/sessionEngine.ts`, `server/apiAuth.ts` |
| Данные | `server/dataStore.ts`, `db.json` |
| Обновления | `server/updateEngine.ts`, `src/utils/updateCheck.ts` |
| Express entry | `server.ts` |

## UI tabs (activeTab)

dashboard, objects, computers, network, peripherals, orgtech, surveillance, consumables, other_equip, employees, warehouse, software, inventory, warranties, reports, activity_log, security, settings

## Runtime data (STACK_DATA_DIR)

`db.json`, `store_meta.json`, `db_config.json`, `sessions_store.enc` — при смене `DB_ENCRYPTION_KEY` удалить `sessions_store.enc`.

## Cursor rules

`.cursor/rules/*.mdc` — автоматический контекст для AI в IDE.
