/*
 * Server workspace persistence with revision conflict retry
 */
import { apiFetch, setDataRevisionHeader, newIdempotencyKey } from './apiClient';

export type PersistResult =
  | { ok: true; revision: number }
  | { ok: false; error: string; status: number; code?: string };

export async function persistWorkspaceState(
  payload: Record<string, unknown>,
  revision: number | null,
  maxRetries = 0
): Promise<PersistResult> {
  let attemptRevision = revision;
  const idempotencyKey = newIdempotencyKey();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await apiFetch<{ success?: boolean; revision?: number }>(
      '/api/data',
      {
        method: 'POST',
        headers: setDataRevisionHeader(attemptRevision),
        body: JSON.stringify(payload),
      },
      idempotencyKey
    );

    if (result.ok) {
      const rev = result.data?.revision;
      return {
        ok: true as const,
        revision: typeof rev === 'number' ? rev : (attemptRevision ?? 0) + 1,
      };
    }

    const failed = result as Extract<typeof result, { ok: false }>;

    if (failed.conflict && attempt < maxRetries) {
      const conflict = (
        failed.payload && typeof failed.payload === 'object' ? failed.payload : {}
      ) as { revision?: number };
      if (typeof conflict.revision === 'number') {
        attemptRevision = conflict.revision;
        continue;
      }
    }

    return {
      ok: false as const,
      error: failed.error || 'Save failed',
      status: failed.status,
      code: failed.code,
    };
  }

  return {
    ok: false as const,
    error: 'Save conflict after retries',
    status: 409,
    code: 'REVISION_CONFLICT',
  };
}

export async function purgeWorkspaceOnServer(
  revision: number | null
): Promise<
  | { ok: true; data: Record<string, unknown>; revision: number }
  | { ok: false; error: string; status: number }
> {
  const idempotencyKey = newIdempotencyKey();
  const result = await apiFetch<{ success?: boolean; revision?: number; data?: Record<string, unknown> }>(
    '/api/data/purge-workspace',
    {
      method: 'POST',
      headers: setDataRevisionHeader(revision),
    },
    idempotencyKey
  );

  if (result.ok === false) {
    return { ok: false as const, error: result.error, status: result.status };
  }

  const data = result.data?.data;
  const revisionOut = result.data?.revision;
  if (!data || typeof data !== 'object' || typeof revisionOut !== 'number') {
    return { ok: false, error: 'Invalid purge response', status: 500 };
  }

  return { ok: true, data, revision: revisionOut };
}
