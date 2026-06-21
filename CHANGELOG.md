# Changelog

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
- Full audit report: `docs/AUDIT_REPORT.md`.

---

## [2.0.13] — 2026-06-18

- Warehouse receipt pre-validation before state mutation.
- `inventoryBaseFamilyTaken`, batch allocation guard.
- Object/employee/user delete cascades.
- Server-side `workspaceValidation.ts` on `POST /api/data`.

## [2.0.12] — Project reindex, inv-number dedup, warehouse receipt fixes.

## [2.0.11] — Equipment receipt duplicate fixes across warehouse flows.
