/*
 * User credential storage helpers
 */
import { loadApplicationData, saveApplicationData, type StoredUser } from "./dataStore.ts";
import { hashPassword, validateEmailField, validateLoginField, validatePasswordField } from "./passwordHash.ts";
import { buildDefaultWorkspacePayload } from "./defaultWorkspaceSeed.ts";
import { validateWorkspacePayload } from "./workspaceValidation.ts";

export type { StoredUser };

export async function getStoredUsers(): Promise<StoredUser[]> {
  const { data } = await loadApplicationData();
  if (!data || !Array.isArray(data.users)) return [];
  return data.users as StoredUser[];
}

export async function isSetupRequired(): Promise<boolean> {
  const users = await getStoredUsers();
  return users.length === 0;
}

export function sanitizeUserForClient(user: StoredUser): Record<string, unknown> {
  const { password: _p, passwordHash: _h, ...rest } = user;
  return {
    ...rest,
    passwordSet: Boolean(user.passwordHash || user.password),
  };
}

export function sanitizePayloadForClient(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return data;
  if (!Array.isArray(data.users)) return data;
  return {
    ...data,
    users: (data.users as StoredUser[]).map((u) => sanitizeUserForClient(u)),
  };
}

export function processUsersForStorage(
  incoming: StoredUser[],
  previous: StoredUser[]
): StoredUser[] {
  return incoming.map((u) => {
    const prev = previous.find((p) => p.id === u.id);
    const row: StoredUser = { ...u };
    const plain = typeof u.password === "string" ? u.password.trim() : "";

    if (plain) {
      const passErr = validatePasswordField(plain);
      if (passErr) throw new Error(`${u.login || u.name}: ${passErr}`);
      row.passwordHash = hashPassword(plain);
    } else if (prev?.passwordHash) {
      row.passwordHash = prev.passwordHash;
    } else if (prev?.password) {
      row.passwordHash = hashPassword(prev.password);
    } else if (!prev) {
      throw new Error(`${u.login || u.name}: пароль обязателен (не менее 8 символов)`);
    }

    delete row.password;
    return row;
  });
}

export async function preparePayloadForSave(
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const validationError = validateWorkspacePayload(payload);
  if (validationError) throw new Error(validationError);

  if (!Array.isArray(payload.users)) return payload;
  const { data } = await loadApplicationData();
  const previous = Array.isArray(data?.users) ? (data!.users as StoredUser[]) : [];
  return {
    ...payload,
    users: processUsersForStorage(payload.users as StoredUser[], previous),
  };
}

export interface SetupAdminInput {
  login: string;
  password: string;
  email: string;
}

export function validateSetupInput(input: SetupAdminInput): string | null {
  const loginErr = validateLoginField(input.login);
  if (loginErr) return loginErr;
  const passErr = validatePasswordField(input.password);
  if (passErr) return passErr;
  const emailErr = validateEmailField(input.email);
  if (emailErr) return emailErr;
  return null;
}

export async function createInitialAdmin(input: SetupAdminInput): Promise<StoredUser> {
  if (!(await isSetupRequired())) {
    throw new Error("Setup already completed");
  }

  const validationError = validateSetupInput(input);
  if (validationError) throw new Error(validationError);

  const login = input.login.trim();
  const email = input.email.trim().toLowerCase();
  const admin: StoredUser = {
    id: `user-${Date.now()}`,
    name: login,
    email,
    role: "Admin",
    login,
    passwordHash: hashPassword(input.password),
    emailVerified: true,
    emailNotificationsEnabled: true,
  };

  const { data } = await loadApplicationData();
  const base: Record<string, unknown> =
    data && typeof data === "object" && Object.keys(data).length > 0
      ? { ...data }
      : buildDefaultWorkspacePayload(email);

  base.users = [admin];
  base.adminEmail = email;

  await saveApplicationData(base as Record<string, unknown>, null);
  return admin;
}
