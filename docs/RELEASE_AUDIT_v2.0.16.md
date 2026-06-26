# Отчёт полного аудита Vicariustab v2.0.17

**Дата:** 22.06.2026  
**Репозиторий:** https://github.com/llDecsterll/vicariustab  
**Версия:** 2.0.17  
**Статус:** Релиз на GitHub · keyserver остаётся локально

---

## 1. Резюме

| Категория | Автотесты | Статус |
|-----------|-----------|--------|
| Склад / lifecycle (31 подтип × 100 шт.) | 32 | ✅ |
| Списание / отмена | 16 | ✅ |
| Восстановление из истории | **12 (NEW)** | ✅ |
| Оборудование / инв. номера | 8 | ✅ |
| Маршрутизация групп | 4 | ✅ |
| Excel склад | 5 | ✅ |
| Лицензия / backup | 11 | ✅ |
| API / security | 8 | ✅ (при запущенном сервере) |
| TypeScript / build / i18n | lint + build + 1656 keys | ✅ |
| UI / E2E | — | ⚠️ ручная приёмка |

**Итого автотестов:** ~108 (96 unit + integration при сервере)

---

## 2. Исправления после аудита (22.06.2026)

| # | Проблема | Исправление |
|---|----------|-------------|
| 1 | Частичное списание 2/5 списывало всю партию | `markPendingWriteOff.ts`, `equipmentDelete.ts`, `App.tsx` |
| 2 | Deploy по корневому inv вместо lineKey | `App.tsx` explicitIds + lineKey |
| 3 | `unit-lifecycle.mjs` без tsx loader | `run-all.mjs` |
| 4 | **`restoreWriteOff.ts` без тестов** | `unit-restore-writeoff.mjs` (12 тестов) |
| 5 | **SecurityView недоступен из меню** | Пункт «Кибербезопасность» в `Sidebar.tsx` |
| 6 | Viewer 403 не тестировался | `integration-api.mjs` — seed + login + 403 |
| 7 | load-concurrent skip без auth | Унифицирован login (audit_admin / verify_admin) |
| 8 | Устаревшие счётчики в AGENTS.md | Обновлено |

---

## 3. Матрица автотестов

```
scripts/audit-tests/
├── unit-equipment.mjs              (8)
├── unit-lifecycle.mjs              (9)
├── unit-validation.mjs             (6)
├── unit-warehouse-excel.mjs        (5)
├── unit-writeoff.mjs               (16)
├── unit-restore-writeoff.mjs       (12)  ← NEW
├── unit-warehouse-full-lifecycle.mjs (32)
├── unit-routing.mjs                (4)
├── unit-backup-license.mjs         (4)
├── unit-license-server.mjs         (7)
├── integration-api.mjs               (5, нужен сервер)
├── load-concurrent.mjs             (1, нужен сервер)
└── security.mjs                    (3)
```

Команды:

```bash
npm run lint
npm run check:i18n
npm run test:unit
npm run test:audit          # сервер на :8098
npm run build
npm run verify http://127.0.0.1:8098
```

---

## 4. Известные ограничения (не блокеры)

| ID | Описание | Приоритет |
|----|----------|-----------|
| L-01 | Нет Playwright E2E в CI | P2 |
| L-02 | Bundle index ~1.76 MB | P3 |
| L-03 | Viewer получает полный JSON (фильтр UI) | By design |
| L-04 | `DB_ENCRYPTION_KEY` обязателен на prod | P1 |
| L-05 | SQL path без integration-тестов | P2 |
| L-06 | 17 untranslated EN strings (технические) | P3 |

---

## 5. Чеклист ручной приёмки

- [ ] 18 вкладок sidebar (включая «Кибербезопасность»)
- [ ] Склад: 100 → split 50 → deploy 50 → split 25 → write-off 25 → stock 25
- [ ] Восстановление из истории списания
- [ ] Excel / backup / update после активации лицензии
- [ ] Viewer read-only, Admin full access
- [ ] Dashboard KPI, печать актов

---

*Vicariustab © Utkin V.V.*
