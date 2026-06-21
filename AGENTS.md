# Vicariustab — индекс проекта

**Версия:** 2.0.12 · **Repo:** https://github.com/llDecsterll/vicariustab

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
| Seed (демо при setup) | `server/workspaceSeed.json`, `src/initialData.ts` |
| Пустой workspace (purge) | `src/emptyWorkspace.ts`, `server/purgeWorkspace.ts` |
| Склад (unified TMZ) | `src/components/WarehouseView.tsx` |
| Удаление/возврат/каскад | `src/utils/equipmentDelete.ts` |
| Inv. номера, batch, dedup | `src/utils/equipmentFields.ts` |
| Маршрут склад→группы | `src/utils/warehouseRouting.ts` |
| Модалки confirm | `ConfirmDeleteModal.tsx`, `ConfirmReturnModal.tsx` |
| Лицензия | `src/utils/license.ts`, `server/licenseCore.ts` |
| Sync + revision + purge API | `src/utils/workspaceSync.ts` |
| Auth/sessions | `src/utils/sessionAuth.ts`, `server/sessionEngine.ts`, `server/apiAuth.ts` |
| Данные | `server/dataStore.ts`, `db.json` |
| Обновления | `server/updateEngine.ts`, `src/utils/updateCheck.ts` |
| Express entry | `server.ts` |

## UI tabs (activeTab)

dashboard, objects, computers, network, peripherals, orgtech, surveillance, consumables, other_equip, employees, warehouse, software, inventory, warranties, reports, activity_log, security, settings

## Ключевая логика (v2.0.11+)

### Поступление на склад (`handleWarehouseReceipt`)

1. Позиция в `warehouseItems` (+qty при том же inv)
2. Авто-распределение: computers / network / software
3. **Без дублей в UI:** `isStockRegistryDuplicateOfWarehouseBatch` скрывает карточки «На складе», если есть строка склада
4. **Уникальные inv:** `allocateBatchInventoryNumbers`, `exactInventoryNumberTaken`

### Unified list склада

`whUnified` + `stockCompsUnified` (только orphans) + `compsUnified` + `netUnified` + `softUnified`

### Очистка БД (Admin)

`POST /api/data/purge-workspace` — удаляет инвентаризацию, сохраняет users/license/UI.

## Runtime data (STACK_DATA_DIR)

`db.json`, `store_meta.json`, `db_config.json`, `sessions_store.enc` — при смене `DB_ENCRYPTION_KEY` удалить `sessions_store.enc`.

## Cursor rules

`.cursor/rules/*.mdc` — автоматический контекст для AI в IDE.
