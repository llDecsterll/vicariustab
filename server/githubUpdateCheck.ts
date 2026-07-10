/*
 * GitHub release / commit update check (server-side; works without GitHub Releases)
 */
import type { UpdateCheckPayload } from "./updateEngine.ts";

const DEFAULT_REPO =
  process.env.GITHUB_UPDATE_REPO || "https://github.com/llDecsterll/vicariustab.git";

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function parseGithubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function githubApiHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "Vicariustab-Update-Checker/1.0",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchMainCommitSha(
  owner: string,
  repo: string,
  branch: string
): Promise<{ sha: string; date: string; message: string; url: string } | null> {
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
    { headers: githubApiHeaders() }
  );
  if (!commitRes.ok) return null;
  const head = (await commitRes.json()) as {
    sha?: string;
    html_url?: string;
    commit?: { message?: string; author?: { date?: string } };
  };
  if (!head?.sha) return null;
  return {
    sha: head.sha,
    date: head.commit?.author?.date || "",
    message: head.commit?.message || "",
    url: head.html_url || "",
  };
}

async function fetchRemotePackageVersion(
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  try {
    const rawPkgRes = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`,
      { headers: { "User-Agent": "Vicariustab-Update-Checker/1.0" } }
    );
    if (!rawPkgRes.ok) return "";
    const remotePkg = (await rawPkgRes.json()) as { version?: string };
    return String(remotePkg.version || "").trim();
  } catch {
    return "";
  }
}

export async function performGithubUpdateCheck(
  installedCommit: string,
  clientVersion: string,
  repoUrl: string = DEFAULT_REPO
): Promise<UpdateCheckPayload> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL");
  }

  const { owner, repo } = parsed;
  let latestTag = "";
  let releaseUrl = `https://github.com/${owner}/${repo}`;
  let releaseNotes = "";
  let publishedAt = "";
  let latestCommitSha = "";
  let defaultBranch = "main";
  let updateSource: "release" | "tag" | "commit" | "package" = "commit";

  const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubApiHeaders(),
  });
  if (repoMetaRes.ok) {
    const meta = (await repoMetaRes.json()) as { default_branch?: string; html_url?: string };
    defaultBranch = meta.default_branch || "main";
    releaseUrl = meta.html_url || releaseUrl;
  }

  const releaseRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    { headers: githubApiHeaders() }
  );

  if (releaseRes.ok) {
    const release = (await releaseRes.json()) as {
      tag_name?: string;
      html_url?: string;
      body?: string;
      published_at?: string;
    };
    latestTag = release.tag_name || "";
    releaseUrl = release.html_url || releaseUrl;
    releaseNotes = release.body || "";
    publishedAt = release.published_at || "";
    updateSource = "release";
  } else {
    const tagRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/tags?per_page=1`,
      { headers: githubApiHeaders() }
    );
    if (tagRes.ok) {
      const tags = (await tagRes.json()) as Array<{ name?: string }>;
      latestTag = tags[0]?.name || "";
      if (latestTag) {
        releaseUrl = `https://github.com/${owner}/${repo}/releases/tag/${latestTag}`;
        updateSource = "tag";
      }
    }
  }

  const head = await fetchMainCommitSha(owner, repo, defaultBranch);
  if (head) {
    latestCommitSha = head.sha;
    if (!latestTag) {
      latestTag = `${defaultBranch}@${head.sha.slice(0, 7)}`;
      releaseNotes = head.message;
      publishedAt = head.date;
      releaseUrl = head.url || releaseUrl;
      if (updateSource !== "release" && updateSource !== "tag") {
        updateSource = "commit";
      }
    }
  }

  let remoteVersion = await fetchRemotePackageVersion(owner, repo, defaultBranch);
  if (!remoteVersion && latestTag) {
    remoteVersion = latestTag.replace(/^v/i, "");
  }

  if (remoteVersion) {
    const tagVersion = latestTag.replace(/^v/i, "");
    if (!latestTag || compareSemver(remoteVersion, tagVersion) > 0) {
      latestTag = remoteVersion.startsWith("v") ? remoteVersion : `v${remoteVersion}`;
      if (updateSource === "tag" || updateSource === "release") {
        updateSource = "package";
      }
    }
  }

  if (!remoteVersion && !latestCommitSha) {
    throw new Error("Unable to reach GitHub API for this repository");
  }

  if (!remoteVersion) {
    remoteVersion = latestTag || latestCommitSha.slice(0, 7);
    updateSource = "package";
  }

  const versionNewer = Boolean(remoteVersion && compareSemver(remoteVersion, clientVersion) > 0);
  const commitShaShort = latestCommitSha.toLowerCase().slice(0, 7);
  const installedShort = installedCommit.toLowerCase().slice(0, 7);
  const commitChanged = Boolean(
    commitShaShort && installedShort && commitShaShort !== installedShort
  );
  const updateAvailable = versionNewer || commitChanged;

  return {
    repository: `${owner}/${repo}`,
    repoUrl,
    currentVersion: clientVersion,
    remoteVersion: remoteVersion || latestTag || latestCommitSha,
    updateAvailable,
    latestTag,
    releaseUrl,
    releaseNotes,
    publishedAt,
    latestCommitSha,
    defaultBranch,
    updateSource,
    checkedAt: new Date().toISOString(),
  };
}
