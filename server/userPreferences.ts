import type { UserDashboardLayoutPreference, UserPreferences } from "../src/types.ts";

const ALLOWED_LANGUAGES = new Set(["ru", "en", "zh"]);

function isGridItem(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const row = item as Record<string, unknown>;
  return (
    typeof row.i === "string" &&
    typeof row.x === "number" &&
    typeof row.y === "number" &&
    typeof row.w === "number" &&
    typeof row.h === "number"
  );
}

export function sanitizeUserPreferencesPatch(patch: unknown): Partial<UserPreferences> {
  if (!patch || typeof patch !== "object") return {};
  const input = patch as Record<string, unknown>;
  const out: Partial<UserPreferences> = {};

  if (typeof input.language === "string" && ALLOWED_LANGUAGES.has(input.language)) {
    out.language = input.language as UserPreferences["language"];
  }

  if (input.dashboardSelectedAuditId !== undefined) {
    const id = String(input.dashboardSelectedAuditId || "").trim();
    if (id.length > 0 && id.length <= 128) {
      out.dashboardSelectedAuditId = id;
    } else if (id.length === 0) {
      out.dashboardSelectedAuditId = "";
    }
  }

  const layout = input.dashboardLayout;
  if (layout && typeof layout === "object") {
    const raw = layout as Record<string, unknown>;
    if (raw.version === 11 && Array.isArray(raw.items)) {
      const items = raw.items.filter(isGridItem).slice(0, 48);
      if (items.length > 0) {
        out.dashboardLayout = { version: 11, items } as UserDashboardLayoutPreference;
      }
    }
  }

  return out;
}

export function mergeUserPreferences(
  current: UserPreferences | undefined,
  patch: Partial<UserPreferences>
): UserPreferences {
  const base: UserPreferences = current ? { ...current } : {};
  if (patch.language !== undefined) {
    base.language = patch.language;
  }
  if (patch.dashboardLayout !== undefined) {
    base.dashboardLayout = patch.dashboardLayout;
  }
  if (patch.dashboardSelectedAuditId !== undefined) {
    if (patch.dashboardSelectedAuditId) {
      base.dashboardSelectedAuditId = patch.dashboardSelectedAuditId;
    } else {
      delete base.dashboardSelectedAuditId;
    }
  }
  return base;
}
