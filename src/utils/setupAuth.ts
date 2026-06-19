/*
 * First-run setup API client
 */
export async function fetchSetupStatus(): Promise<{ setupRequired: boolean }> {
  try {
    const res = await fetch('/api/auth/setup-status');
    if (!res.ok) return { setupRequired: true };
    return (await res.json()) as { setupRequired: boolean };
  } catch {
    return { setupRequired: true };
  }
}

export async function completeInitialSetup(input: {
  login: string;
  password: string;
  email: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { error?: string; success?: boolean };
    if (!res.ok) return { ok: false, error: data.error || 'Setup failed' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
