/*
 * Default workspace data seeded on first-run admin setup
 */
import fs from "fs";
import path from "path";

let cachedSeed: Record<string, unknown> | null = null;

function resolveSeedPath(): string {
  const candidates = [
    path.join(process.cwd(), "server", "workspaceSeed.json"),
    path.join(process.cwd(), "dist", "server", "workspaceSeed.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("workspaceSeed.json not found");
}

function loadWorkspaceSeed(): Record<string, unknown> {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(fs.readFileSync(resolveSeedPath(), "utf-8")) as Record<string, unknown>;
  }
  return cachedSeed;
}

export function buildDefaultWorkspacePayload(adminEmail: string): Record<string, unknown> {
  return {
    ...loadWorkspaceSeed(),
    adminEmail,
  };
}
