/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Release
 */

/** Maximum activity log entries kept in workspace payload (newest first). */
export const ACTIVITIES_MAX = 500;

export function capActivitiesList<T>(activities: T[]): T[] {
  if (activities.length <= ACTIVITIES_MAX) return activities;
  return activities.slice(0, ACTIVITIES_MAX);
}

export function capActivitiesInPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(payload.activities)) return payload;
  const capped = capActivitiesList(payload.activities);
  if (capped.length === payload.activities.length) return payload;
  return { ...payload, activities: capped };
}
