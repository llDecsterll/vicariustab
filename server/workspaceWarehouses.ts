/*
 * Ensure warehouse catalog exists in workspace payloads (MySQL/backup restore).
 */
import type {
  CustomWarehouse,
  ObjectItem,
  WarehouseItem,
  WarehouseWriteOff,
} from "../src/types";
import {
  reconcileWarehouses,
  warehouseCatalogsEqual,
} from "../src/utils/warehouseRouting.ts";

function readWarehouses(payload: Record<string, unknown>): CustomWarehouse[] {
  return Array.isArray(payload.warehouses) ? (payload.warehouses as CustomWarehouse[]) : [];
}

function readWarehouseItems(payload: Record<string, unknown>): WarehouseItem[] {
  return Array.isArray(payload.warehouseItems)
    ? (payload.warehouseItems as WarehouseItem[])
    : [];
}

function readObjects(payload: Record<string, unknown>): ObjectItem[] {
  return Array.isArray(payload.objects) ? (payload.objects as ObjectItem[]) : [];
}

function readWriteOffs(payload: Record<string, unknown>): WarehouseWriteOff[] {
  return Array.isArray(payload.warehouseWriteOffs)
    ? (payload.warehouseWriteOffs as WarehouseWriteOff[])
    : [];
}

/** Restore `warehouses` from stock lines when missing or empty (legacy backups / SQL rows). */
export function ensureWorkspaceWarehouses(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const warehouses = readWarehouses(payload);
  const next = reconcileWarehouses(
    warehouses,
    readWarehouseItems(payload),
    readObjects(payload),
    readWriteOffs(payload)
  );
  if (warehouseCatalogsEqual(warehouses, next)) return payload;
  return { ...payload, warehouses: next };
}

export function workspaceWarehousesChanged(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): boolean {
  return !warehouseCatalogsEqual(readWarehouses(before), readWarehouses(after));
}
