# Отчёт полного аудита Vicariustab v2.0.16

**Дата:** 22.06.2026  
**Репозиторий:** https://github.com/llDecsterll/vicariustab  
**Версия:** 2.0.16 (кандидат релиза)  
**Статус:** Готов к релизу после ручной приёмки UI · **Git push не выполнялся** (по требованию владельца)

---

## 1. Резюме

| Категория | Автотесты | Ручная проверка | Статус |
|-----------|-----------|-----------------|--------|
| Оборудование и количество | 17 unit + 6 lifecycle | Рекомендуется smoke в UI | ✅ Логика покрыта |
| Списание / отмена / восстановление | 6 unit (новые) | Рекомендуется | ✅ Исправлен баг отмены |
| Склады | routing + validation | Рекомендуется | ✅ Защита удаления |
| Группы оборудования | 4 unit routing | — | ✅ |
| Пользователи / роли | integration (частично) + security | Рекомендуется | ⚠️ E2E нет |
| Лицензия / gated-функции | backup-license unit | Рекомендуется | ✅ Усилено |
| Резервное копирование | backup-license + server gate | Рекомендуется | ✅ |
| Обновления GitHub | health + security | Рекомендуется на prod | ✅ Gate добавлен |
| Excel склад | 5 unit | Windows smoke | ✅ |
| Локализация | check:i18n 1653 ключа | Визуально EN/ZH | ✅ 17 untranslated EN |
| Сборка | `npm run build` | — | ✅ |
| TypeScript | `npm run lint` | — | ✅ |

**Итого автотестов:** 51 passed · 0 failed · 4 skipped (нет сессии / concurrent без login)

**verify-flow:** ✅ PASS после `npm run license:keypair` (публичный ключ в product синхронизирован с локальным PEM keyserver).

---

## 2. Исправления в этом аудите

### P0 — Отмена частичного списания не восстанавливала карточки ПК

| | |
|---|---|
| **Симптом** | После «На списание» 6 из 12 и отмены — строка склада объединялась, но связанные `computers` оставались в статусе «На списание» |
| **Причина** | `applyCancelPendingWriteOff` использовал split-inv (`ST-0001/р1`) вместо корневого номера и не учитывал `pickStockComputerIdsForWriteOff` |
| **Исправление** | `cancelPendingWriteOff.ts` — `getSplitRootInventoryNumber` + `markedStockIds` |
| **Тест** | `unit-writeoff.mjs` → `applyCancelPendingWriteOff restores linked registries` |

### P1 — Удаление склада с остатками без предупреждения

| | |
|---|---|
| **Симптом** | Custom-склад удалялся даже при наличии позиций «В наличии» / «На списание» |
| **Исправление** | `WarehouseView.tsx` — блокировка + alert с i18n |
| **Файлы** | `i18n.tsx` (RU/EN/ZH) |

### P2 — Диагностика verify-flow и unit-тесты лицензии

| | |
|---|---|
| **Симптом** | `npm run verify` падал с неясным `validateKey failed` |
| **Причина** | Локальный PEM keyserver не совпадает с встроенным публичным ключом в продукте |
| **Исправление** | Раздельные сообщения server vs client verify в `verify-flow.mjs`; `verifySignedLicenseKeyWithPublicKey` в `licenseCrypto.ts`; `unit-license-server.mjs` (7 тестов); `npm run license:sync-public` для синхронизации pubkey из PEM |

### P1 — Обновление системы доступно без активации

| | |
|---|---|
| **Требование** | Блокировать обновление до ввода ключа (как backup и Excel) |
| **Исправление** | `canUseSystemUpdate()` · UI в `SettingsView` · `requireActivatedLicense` на `POST /api/update/apply` |
| **Примечание** | `GET /api/update/check` остаётся публичным (только метаданные версии) |

---

## 3. Проверка по разделам ТЗ

### 3.1 Управление оборудованием

| Сценарий | Реализация | Тест |
|----------|------------|------|
| Все типы склада (8 категорий) | `WarehouseItemType`, `warehouseRouting` | `unit-routing.mjs` |
| Добавление qty, batch inv | `handleWarehouseReceipt`, `allocateBatchInventoryNumbers` | `unit-equipment.mjs` |
| Разделение партии | `WarehouseView` split + `/рN` inv | `unit-writeoff.mjs` |
| Объединение | `warehousePendingMerge` | `unit-writeoff.mjs` |
| Инв. номера уникальны | client + `workspaceValidation` | `unit-validation.mjs` |
| Серийные номера | `normalizeUnitSerialNumbers`, Excel cols | `unit-warehouse-excel.mjs` |
| Удаление каскадное | `equipmentDelete.ts` | `unit-lifecycle.mjs` |
| Восстановление удалённого | Только из истории списания (`restoreWriteOff`) | unit-writeoff |

**Не автоматизировано:** перенос между складами UI, массовый импорт 1000+ строк — стресс вручную.

### 3.2 Списание

| Сценарий | Статус |
|----------|--------|
| Частичное списание qty | ✅ `markPendingWriteOff.ts` |
| Полное списание | ✅ |
| Отмена + merge | ✅ (исправлено) |
| Восстановление из истории | ✅ `restoreWriteOff.ts` + merge |
| Уникальные pending inv | ✅ `/р1` suffix |

### 3.3 Склады

| Сценарий | Статус |
|----------|--------|
| Создание / редактирование | ✅ UI |
| Удаление пустого склада | ✅ |
| Удаление с остатками | ✅ **заблокировано** |
| Главный склад `wh-1` | ✅ не удаляется |
| Reconcile после import | ✅ `workspaceWarehouses.ts` |

### 3.4 Группы оборудования

Строгая маршрутизация: `WAREHOUSE_TYPE_TAB` → sidebar tab. Карточки «На складе» скрыты из рабочих групп через `filterComputersByEquipmentTab` и `isStockRegistryDuplicateOfWarehouseBatch`.

### 3.5–3.6 Пользователи и права

| Роль | Просмотр | CRUD оборудования | Users/Backup/Update/DB |
|------|----------|-------------------|------------------------|
| Viewer | ✅ | ❌ UI + `requireWriteRole` | ❌ |
| Editor | ✅ | ✅ | ❌ (частично branding) |
| Admin | ✅ | ✅ | ✅ |

**Проверено автоматически:** `security.mjs` — 401 без токена, rate limit login.  
**Пропущено без сессии:** Viewer 403 write (`integration-api.mjs` skip).

### 3.7–3.8 Лицензия и защита

| Функция | Trial без ключа | После активации | Expired |
|---------|-----------------|-----------------|---------|
| Просмотр / запись данных | ✅ запись | ✅ | ❌ blocked |
| Excel import/export | ❌ | ✅ | ❌ |
| Backup JSON / .enc | ❌ | ✅ | ❌ |
| Установка обновления | ❌ | ✅ | ❌ |
| Активация ключа | ✅ | — | — |

Защита: Ed25519 v2, trial sig, tamper flag, lockout после неверных ключей, strip license из backup.

### 3.9 Резервное копирование

- JSON local: keys whitelist, license stripped (`backupLicensePolicy`)
- Server .enc: AES, `requireActivatedLicense`
- Import: `preparePayloadForSave` + validation

### 3.10 Обновления

- `githubUpdateCheck.ts` + `updateEngine.ts`
- Apply только Admin + activated
- Dev mode: apply отключён (403)

### 3.11–3.13 UI, Dashboard, Печать

**Автотесты отсутствуют** (Playwright не в CI). Рекомендуемый чеклист:

- [ ] Все 18 вкладок sidebar без наложений (1920 / 1366 / mobile)
- [ ] Светлая / тёмная тема
- [ ] Dashboard KPI = фактические counts в БД
- [ ] Печать: акт списания, инвентаризация, карточка, шапка документа
- [ ] `npm run screenshots` для README

### 3.14–3.16 Производительность и стресс

| Проверка | Результат |
|----------|-----------|
| Bundle size | index ~1.75 MB (warning Vite >500kB) — известно |
| Concurrent save | `load-concurrent.mjs` — skip без auth |
| 1000+ записей | Не прогонялось в CI |

### 3.15 Локализация

`npm run check:i18n` — **OK**, 1653 ключа. 17 строк EN совпадают с ключом (технические: PNG, create/update/delete types).

---

## 4. Матрица автотестов

```
scripts/audit-tests/
├── unit-equipment.mjs      (7)
├── unit-lifecycle.mjs      (6)
├── unit-validation.mjs     (6)
├── unit-warehouse-excel.mjs (5)
├── unit-writeoff.mjs       (6)  ← NEW
├── unit-routing.mjs        (4)
├── unit-backup-license.mjs (4)
├── unit-license-server.mjs   (7)  ← NEW
├── integration-api.mjs     (2 pass, 3 skip — задайте AUDIT_LOGIN/AUDIT_PASSWORD)
├── security.mjs            (3)
└── load-concurrent.mjs     (1 skip)
```

Команды:

```bash
npm run lint
npm run check:i18n
npm run test:unit      # 34 tests
npm run test:audit     # 51 tests (with server on :8098)
npm run build
npm run verify http://127.0.0.1:8098   # требует синхронизированный keyserver PEM
```

Для integration-тестов с существующей БД:

```bash
$env:AUDIT_LOGIN="ваш_admin"; $env:AUDIT_PASSWORD="пароль"; npm run test:audit
```

---

## 5. Известные ограничения (не блокеры релиза)

| ID | Описание | Приоритет |
|----|----------|-----------|
| L-01 | Нет Playwright E2E в CI | P2 |
| L-02 | `verify-flow` требует **синхронизированную** пару PEM + `licensePublicKey.ts` | P2 env — см. `generate-license-keypair.mjs` |
| L-03 | Badge «На складе» считает строки, не qty | P3 UI |
| L-04 | Hardcoded AES fallback без `DB_ENCRYPTION_KEY` | P1 prod — обязателен .env |
| L-05 | Viewer получает полный workspace JSON (фильтр только UI) | By design |
| L-06 | Chunk >500kB — рекомендуется code-split i18n/charts | P3 perf |

---

## 6. Подготовка к релизу

### Выполнено

- [x] Версия **2.0.16** в `package.json`, `appConfig.ts`
- [x] Исправления P0/P1
- [x] 17 новых/расширенных unit-тестов (writeoff, routing, license-server)
- [x] `npm run lint` / `build` / `test:audit` — PASS
- [x] Отчёт аудита
- [ ] `npm run verify` — после синхронизации keypair (локально)

### Перед публикацией на GitHub (вручную)

1. Ручной smoke UI (чеклист §3.11)
2. `git add` + `commit` + `push` — **только по подтверждению владельца**
3. GitHub Release tag `v2.0.16` + CHANGELOG
4. Production: задать `DB_ENCRYPTION_KEY`, убрать demo trial на боевых серверах

---

## 7. Изменённые файлы (локально, не в git)

| Файл | Изменение |
|------|-----------|
| `cancelPendingWriteOff.ts` | Fix restore computers on cancel partial write-off |
| `WarehouseView.tsx` | Block warehouse delete with stock |
| `SettingsView.tsx` | Gate system update until license |
| `license.ts` | `canUseSystemUpdate` |
| `server.ts` | `requireActivatedLicense` on update apply |
| `warehouseRouting.ts` | export `WAREHOUSE_TYPE_TAB` |
| `i18n.tsx` | New strings |
| `licenseCrypto.ts` | `verifySignedLicenseKeyWithPublicKey` для тестов |
| `verify-flow.mjs` | Чёткая диагностика PEM vs public key |
| `unit-license-server.mjs` | 7 server license tests |
| `integration-api.mjs` | AUDIT_LOGIN/AUDIT_PASSWORD в before hook |
| `run-all.mjs`, `package.json` | Test runner + test:unit |

---

*Автор аудита: AI-агент Cursor · Vicariustab © Utkin V.V.*
