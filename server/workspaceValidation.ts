/*
 * Server-side workspace payload validation (inventory uniqueness, admin guard)
 */
import {
  exactInventoryNumberTaken,
  inventoryNumbersMatch,
} from "../src/utils/equipmentFields.ts";

function softwareWarehouseInv(softwareId: string): string {
  return `SWH-${softwareId}`;
}

type InvCtx = {
  warehouseItems: { id?: string; inventoryNumber?: string }[];
  computers: { id?: string; inventoryNumber?: string }[];
  networkDevices: { id?: string; inventoryNumber?: string }[];
  softwareItems: { id?: string; licenseKey?: string }[];
  softwareWarehouseInv: (softwareId: string) => string;
};

function buildInvCtx(payload: Record<string, unknown>): InvCtx {
  return {
    warehouseItems: Array.isArray(payload.warehouseItems)
      ? (payload.warehouseItems as { id?: string; inventoryNumber?: string }[])
      : [],
    computers: Array.isArray(payload.computers)
      ? (payload.computers as { id?: string; inventoryNumber?: string }[])
      : [],
    networkDevices: Array.isArray(payload.networkDevices)
      ? (payload.networkDevices as { id?: string; inventoryNumber?: string }[])
      : [],
    softwareItems: Array.isArray(payload.softwareItems)
      ? (payload.softwareItems as { id?: string; licenseKey?: string }[])
      : [],
    softwareWarehouseInv: softwareWarehouseInv,
  };
}

/** Reject exact duplicate inventory numbers and conflicting warehouse batches. */
export function validateWorkspaceInventory(payload: Record<string, unknown>): string | null {
  const ctx = buildInvCtx(payload);
  const entries: { key: string; label: string }[] = [];

  const pushExact = (raw: string | undefined | null, label: string) => {
    const inv = (raw || "").trim();
    if (!inv || inv.toUpperCase() === "NET-EQ") return;
    entries.push({ key: inv.toLowerCase(), label });
  };

  for (const w of ctx.warehouseItems) {
    pushExact(w.inventoryNumber, `склад:${w.id || "?"}`);
  }
  for (const c of ctx.computers) {
    pushExact(c.inventoryNumber, `оборудование:${c.id || "?"}`);
  }
  for (const n of ctx.networkDevices) {
    pushExact(n.inventoryNumber, `сеть:${n.id || "?"}`);
  }
  for (const s of ctx.softwareItems) {
    pushExact(s.licenseKey, `ПО:${s.id || "?"}`);
    pushExact(softwareWarehouseInv(s.id || ""), `ПО-склад:${s.id || "?"}`);
  }

  const seen = new Map<string, string>();
  for (const { key, label } of entries) {
    if (seen.has(key)) {
      return `Дублирующийся инвентарный номер «${key}» (${seen.get(key)} и ${label})`;
    }
    seen.set(key, label);
  }

  for (const w of ctx.warehouseItems) {
    const inv = (w.inventoryNumber || "").trim();
    if (!inv) continue;
    if (exactInventoryNumberTaken(inv, ctx, w.id)) {
      return `Инвентарный номер «${inv}» уже занят`;
    }
  }

  const warehouseBases = ctx.warehouseItems
    .map((w) => (w.inventoryNumber || "").trim())
    .filter(Boolean);

  for (const c of ctx.computers) {
    const inv = (c.inventoryNumber || "").trim();
    if (!inv) continue;
    const whMatch = warehouseBases.some((base) => inventoryNumbersMatch(inv, base));
    if (!whMatch && exactInventoryNumberTaken(inv, ctx, c.id)) {
      return `Инвентарный номер «${inv}» уже занят`;
    }
  }

  return null;
}

export function validateAdminUsersRemain(payload: Record<string, unknown>): string | null {
  if (!Array.isArray(payload.users)) return null;
  const users = payload.users as { role?: string; isBlocked?: boolean }[];
  const activeAdmins = users.filter((u) => u.role === "Admin" && !u.isBlocked);
  if (activeAdmins.length === 0) {
    return "В системе должен остаться хотя бы один активный администратор";
  }
  return null;
}

export function validateWorkspacePayload(payload: Record<string, unknown>): string | null {
  return validateWorkspaceInventory(payload) || validateAdminUsersRemain(payload);
}
