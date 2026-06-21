/*
 * Server-side workspace payload validation (inventory uniqueness, admin guard)
 */
import {
  exactInventoryNumberTaken,
  getSoftwareWarehouseInv,
  inventoryNumbersMatch,
} from "../src/utils/equipmentFields.ts";

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
    softwareWarehouseInv: getSoftwareWarehouseInv,
  };
}

/** Reject exact duplicate inventory numbers and conflicting warehouse batches. */
export function validateWorkspaceInventory(payload: Record<string, unknown>): string | null {
  const ctx = buildInvCtx(payload);

  const duplicateAmong = (
    items: { id?: string; inventoryNumber?: string }[],
    groupLabel: string
  ): string | null => {
    const seen = new Map<string, string>();
    for (const item of items) {
      const inv = (item.inventoryNumber || "").trim();
      if (!inv || inv.toUpperCase() === "NET-EQ") continue;
      const key = inv.toLowerCase();
      if (seen.has(key)) {
        return `Дублирующийся инвентарный номер «${inv}» (${groupLabel}:${seen.get(key)} и ${groupLabel}:${item.id || "?"})`;
      }
      seen.set(key, item.id || "?");
    }
    return null;
  };

  const dupWh = duplicateAmong(ctx.warehouseItems, "склад");
  if (dupWh) return dupWh;
  const dupComp = duplicateAmong(ctx.computers, "оборудование");
  if (dupComp) return dupComp;
  const dupNet = duplicateAmong(ctx.networkDevices, "сеть");
  if (dupNet) return dupNet;

  const softwareKeys = new Map<string, string>();
  for (const s of ctx.softwareItems) {
    const key = (s.licenseKey || "").trim();
    if (key) {
      const lower = key.toLowerCase();
      if (softwareKeys.has(lower)) {
        return `Дублирующийся инвентарный номер «${key}» (${softwareKeys.get(lower)} и ПО:${s.id || "?"})`;
      }
      softwareKeys.set(lower, `ПО:${s.id || "?"}`);
    }
    const syntheticWhInv = getSoftwareWarehouseInv(s.id || "");
    const whLineForSoftware = ctx.warehouseItems.some(
      (w) => (w.inventoryNumber || "").trim().toLowerCase() === syntheticWhInv.toLowerCase()
    );
    if (!whLineForSoftware) {
      const lower = syntheticWhInv.toLowerCase();
      if (softwareKeys.has(lower)) {
        return `Дублирующийся инвентарный номер «${syntheticWhInv}» (${softwareKeys.get(lower)} и ПО-склад:${s.id || "?"})`;
      }
      softwareKeys.set(lower, `ПО-склад:${s.id || "?"}`);
    }
  }

  for (const w of ctx.warehouseItems) {
    const inv = (w.inventoryNumber || "").trim();
    if (!inv) continue;
    const linkedSoftwareStock = ctx.softwareItems.some(
      (s) => getSoftwareWarehouseInv(s.id || "").toLowerCase() === inv.toLowerCase()
    );
    if (linkedSoftwareStock) continue;

    const ctxExcludingBatchRegistry: InvCtx = {
      ...ctx,
      computers: ctx.computers.filter(
        (c) => !inventoryNumbersMatch(c.inventoryNumber, w.inventoryNumber)
      ),
      networkDevices: ctx.networkDevices.filter(
        (n) => !inventoryNumbersMatch(n.inventoryNumber, w.inventoryNumber)
      ),
    };
    if (exactInventoryNumberTaken(inv, ctxExcludingBatchRegistry, w.id)) {
      return `Инвентарный номер «${inv}» уже занят`;
    }
  }

  const warehouseBases = ctx.warehouseItems
    .map((w) => (w.inventoryNumber || "").trim())
    .filter(Boolean);

  const validateRegistryItem = (
    inv: string,
    id: string | undefined,
    kind: "computer" | "network"
  ): string | null => {
    const whMatch = warehouseBases.some((base) => inventoryNumbersMatch(inv, base));
    if (!whMatch && exactInventoryNumberTaken(inv, ctx, id)) {
      return `Инвентарный номер «${inv}» уже занят (${kind})`;
    }
    return null;
  };

  for (const c of ctx.computers) {
    const inv = (c.inventoryNumber || "").trim();
    if (!inv) continue;
    const err = validateRegistryItem(inv, c.id, "computer");
    if (err) return err;
  }

  for (const n of ctx.networkDevices) {
    const inv = (n.inventoryNumber || "").trim();
    if (!inv) continue;
    const err = validateRegistryItem(inv, n.id, "network");
    if (err) return err;
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
