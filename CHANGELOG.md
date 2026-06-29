# Changelog

## [2.0.20] — 2026-06-29

### Fixed (MySQL / PostgreSQL)
- SQL save failures no longer fall through silently while only the local file updates (prevents stale SQL on next load).
- `orbit_secure_store` prunes keys removed from the workspace payload on each save.

### Added
- `unit-sql-persistence.mjs` — round-trip tests for users, roles, warehouses, costs, photos, and SQL key cleanup.

---

## [2.0.19] — 2026-06-29

### Fixed (склад)
- Скрыта колонка «Серийный номер» в таблице ТМЦ на складе.
- Исправлена ошибка сохранения `Data conflict — another session saved changes first`: актуальный revision после self-heal на сервере и повторные попытки записи.

---

## [2.0.18] — 2026-06-22

### Fixed
- Warehouse card «Единицы в реестре» scoped to warehouse line and on-stock units only; issued units shown separately.
- Serial numbers in warehouse detail use `resolveWarehouseItemSerialLines` (line key, not root batch).
- Warehouse return restores serials and matches exact stock line (`findActiveWarehouseStockLineIndex`).
- Write-off, split, merge, and «На списание» use line-key scoping across equipment types.

### Added
- `findRegistryComputersForWarehouseLine` and extended `warehouseLifecycleEngine` (merge, return, cancel pending).
- Extended audit: 31 subtype scenarios for merge → deploy → return → cancel → write-off.

### Testing
- Full audit suite passes; `unit-warehouse-full-lifecycle` now 63 scenarios.

---

## [2.0.17] — 2026-06-22

### Fixed
- Partial warehouse write-off (e.g. 2 of 5) no longer removes entire batch; qty normalization and line-key scoping.
- Deploy from split warehouse lines matches by `getWarehouseLineInventoryKey`, not root inventory only.
- Cancel partial write-off restores linked computer cards (`cancelPendingWriteOff.ts`).
- Split pending lines (`/рN`) no longer merge incorrectly (`warehousePendingMerge.ts`).

### Added
- `warehouseLifecycleEngine.ts` — pure lifecycle simulator for all 31 equipment subtypes.
- Audit tests: `unit-warehouse-full-lifecycle.mjs` (32), `unit-restore-writeoff.mjs` (13).
- Sidebar navigation to **Кибербезопасность** (`SecurityView`).
- Integration test: Viewer role gets 403 on `POST /api/data`.

### Testing
- Full audit suite ~109 tests; `test:unit` 99 tests.
- `run-all.mjs`: tsx loader for lifecycle and restore suites.

### Documentation
- Updated `docs/RELEASE_AUDIT_v2.0.16.md`, `AGENTS.md`.

---

## [2.0.16] — 2026-06-22

- Initial public release baseline (warehouse write-off UI, v2.0.16 audit).

---

## [2.0.15] — 2026-06-18

### Fixed
- Server save rejected valid warehouse receipts when qty=1: warehouse line and stock computer card share the same base inv (e.g. `ST-0070`). Validation now checks duplicates per entity type and excludes batch-linked registry rows from warehouse conflict checks.

---

## [2.0.14] — 2026-06-18 (audit-fix)

### Security
- Login rate limiting: 10 failed attempts per IP+login per 15 minutes (`server/loginRateLimit.ts`).
- Backup import now runs `preparePayloadForSave` / `validateWorkspacePayload` (inventory dedup, admin guard, password hashing).
- Revision conflict: client no longer blindly retries same payload on 409 (`workspaceSync.ts`).

### Inventory & warehouse
- Shared `getSoftwareWarehouseInv()` in `equipmentFields.ts` — server validation aligned with client (`SW-` + 8-char suffix).
- `findWarehouseItemByInventoryNumber()` for batch-aware warehouse lookups.
- Write-off and deploy use `inventoryNumbersMatch` instead of exact string match.
- Software deploy activates multiple licenses when `quantity > 1`.
- Employee delete returns issued equipment to warehouse stock (without double-counting items already «На складе»).
- DetailModal field updates validate inventory number uniqueness.

### Backup / restore
- Client restore whitelist extended: `it_software`, `it_custom_warehouses`, `it_warehouse_writeoffs`, `it_public_url`.

### Testing
- Audit test suite: unit, integration, security, load (`scripts/audit-tests/`).
- npm scripts: `test:audit`, `test:unit`.

### Documentation
- Full audit report: `docs/RELEASE_AUDIT_v2.0.16.md`.

---

## [2.0.13] — 2026-06-18

- Warehouse receipt pre-validation before state mutation.
- `inventoryBaseFamilyTaken`, batch allocation guard.
- Object/employee/user delete cascades.
- Server-side `workspaceValidation.ts` on `POST /api/data`.

## [2.0.12] — Project reindex, inv-number dedup, warehouse receipt fixes.

## [2.0.11] — Equipment receipt duplicate fixes across warehouse flows.
