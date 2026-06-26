/* Release */
/**
 * Привязка публичного домена к Vicariustab (Docker + Caddy + Let's Encrypt).
 *
 * Интерактивно:
 *   npm run setup:domain
 *
 * С параметрами:
 *   node scripts/setup-domain.mjs --domain stack.example.com --email admin@example.com
 *   node scripts/setup-domain.mjs --domain stack.example.com --email admin@example.com --mysql
 */
import crypto from "crypto";
import dns from "dns/promises";
import fs from "fs";
import path from "path";
import readline from "readline";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.join(__dirname, "..");
const envPath = path.join(productRoot, ".env");
const envExamplePath = path.join(productRoot, ".env.example");

const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseArgs(argv) {
  const out = {
    domain: "",
    email: "",
    mysql: false,
    yes: false,
    checkOnly: false,
    skipDns: false,
    ufw: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--domain" || a === "-d") out.domain = (argv[++i] || "").trim().toLowerCase();
    else if (a === "--email" || a === "-e") out.email = (argv[++i] || "").trim();
    else if (a === "--mysql") out.mysql = true;
    else if (a === "--yes" || a === "-y") out.yes = true;
    else if (a === "--check-only") out.checkOnly = true;
    else if (a === "--skip-dns") out.skipDns = true;
    else if (a === "--ufw") out.ufw = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
Vicariustab — привязка домена (HTTPS через Caddy + Let's Encrypt)

Использование:
  npm run setup:domain
  node scripts/setup-domain.mjs --domain stack.example.com --email you@example.com

Опции:
  -d, --domain <host>   Публичный домен (A-запись → IP сервера)
  -e, --email <addr>    Email владельца для Let's Encrypt
  --mysql               Запуск с MySQL (docker-compose.mysql.yml)
  -y, --yes             Без подтверждения
  --check-only          Только проверки DNS/Docker, без запуска
  --skip-dns            Пропустить проверку DNS
  --ufw                 Открыть порты 80/443 в ufw (Linux, sudo)

Требования:
  • Ubuntu/VPS с Docker и docker compose
  • DNS A-запись домена указывает на этот сервер
  • Порты 80 и 443 доступны из интернета
`);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function normalizeDomain(raw) {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/\.$/, "");
  return d;
}

function validateDomain(domain) {
  if (!domain) return "Укажите домен, например stack.example.com";
  if (domain === "localhost" || domain.endsWith(".local")) {
    return "Для Let's Encrypt нужен реальный публичный домен, не localhost";
  }
  if (!DOMAIN_RE.test(domain)) return `Некорректный домен: ${domain}`;
  return null;
}

function validateEmail(email) {
  if (!email) return "Укажите email владельца домена (для Let's Encrypt)";
  if (!EMAIL_RE.test(email)) return `Некорректный email: ${email}`;
  return null;
}

function parseEnvFile(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function serializeEnv(map, templateLines) {
  const written = new Set();
  const out = [];

  for (const line of templateLines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      out.push(line);
      continue;
    }
    const key = line.slice(0, line.indexOf("=")).trim();
    if (map.has(key)) {
      out.push(`${key}=${map.get(key)}`);
      written.add(key);
    } else {
      out.push(line);
    }
  }

  for (const [key, val] of map.entries()) {
    if (!written.has(key)) out.push(`${key}=${val}`);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

function ensureEnv(domain, email) {
  const template = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : fs.existsSync(envExamplePath)
      ? fs.readFileSync(envExamplePath, "utf8")
      : "PORT=8080\n";

  const map = parseEnvFile(template);
  const weakKeys = new Set(["", "change-me-in-production", "change-me-to-a-long-random-secret"]);

  if (weakKeys.has(map.get("DB_ENCRYPTION_KEY") || "")) {
    map.set("DB_ENCRYPTION_KEY", crypto.randomBytes(32).toString("base64url"));
  }

  map.set("PORT", map.get("PORT") || "8080");
  map.set("STACK_DOMAIN", domain);
  map.set("STACK_TLS_EMAIL", email);
  map.set("STACK_PUBLIC_URL", `https://${domain}`);
  map.set("TRUST_PROXY", "true");
  map.set("STACK_FORCE_HTTPS", map.get("STACK_FORCE_HTTPS") || "false");
  map.set("NODE_ENV", map.get("NODE_ENV") || "production");

  const body = serializeEnv(map, template.split(/\r?\n/));
  fs.writeFileSync(envPath, body, "utf8");
  return map;
}

function commandExists(cmd) {
  const isWin = process.platform === "win32";
  const probe = spawnSync(isWin ? "where" : "which", [cmd], { encoding: "utf8" });
  return probe.status === 0;
}

function runDockerCompose(args, opts = {}) {
  const attempts = [
    ["docker", ["compose", ...args]],
    ["docker-compose", args],
  ];
  for (const [bin, binArgs] of attempts) {
    if (!commandExists(bin)) continue;
    const res = spawnSync(bin, binArgs, {
      cwd: productRoot,
      stdio: opts.inherit ? "inherit" : "pipe",
      encoding: "utf8",
      env: { ...process.env, ...opts.env },
    });
    if (res.status === 0 || res.status === null) {
      return { ok: true, bin, stdout: res.stdout || "", stderr: res.stderr || "" };
    }
    if (bin === "docker" && /compose/i.test(res.stderr || "")) continue;
    return { ok: false, bin, status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
  }
  return { ok: false, bin: null, stderr: "Docker Compose не найден" };
}

async function fetchPublicIp() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("https://api.ipify.org?format=json", { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.ip === "string" ? data.ip : null;
  } catch {
    return null;
  }
}

async function checkDns(domain, serverIp) {
  const warnings = [];
  try {
    const records = await dns.resolve4(domain);
    if (!records.length) warnings.push(`DNS: для ${domain} нет A-записей`);
    else if (serverIp && !records.includes(serverIp)) {
      warnings.push(
        `DNS: ${domain} → ${records.join(", ")}, но IP этого сервера ${serverIp}. ` +
          "Обновите A-запись и подождите распространения DNS (до 1–24 ч)."
      );
    } else {
      console.log(`✓ DNS: ${domain} → ${records.join(", ")}`);
    }
  } catch (err) {
    warnings.push(`DNS: не удалось разрешить ${domain} (${err.code || err.message})`);
  }
  return warnings;
}

function openUfwPorts() {
  if (process.platform !== "linux" || !commandExists("ufw")) {
    console.log("ℹ ufw не найден — откройте порты 80 и 443 вручную в файерволе.");
    return;
  }
  console.log("→ ufw: открываем 80/tcp и 443/tcp …");
  const res = spawnSync("sudo", ["ufw", "allow", "80,443/tcp"], { stdio: "inherit" });
  if (res.status !== 0) {
    console.warn("⚠ Не удалось настроить ufw. Выполните вручную: sudo ufw allow 80,443/tcp");
  }
}

async function waitForHealth(maxSec = 120) {
  const url = "http://127.0.0.1:8080/api/health";
  const started = Date.now();
  while (Date.now() - started < maxSec * 1000) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log("\n=== Vicariustab: привязка домена (HTTPS) ===\n");

  if (process.platform === "win32") {
    console.log(
      "⚠ Windows: скрипт запускайте на Linux-сервере (VPS), где будет публичный домен.\n" +
        "  Локально Let's Encrypt не выдаст сертификат без белого IP и DNS.\n"
    );
  }

  let domain = normalizeDomain(args.domain);
  let email = args.email;

  if (!domain) domain = normalizeDomain(await ask("Домен (например stack.example.com): "));
  if (!email) email = await ask("Email владельца домена (Let's Encrypt): ");

  const domainErr = validateDomain(domain);
  if (domainErr) {
    console.error("Ошибка:", domainErr);
    process.exit(1);
  }
  const emailErr = validateEmail(email);
  if (emailErr) {
    console.error("Ошибка:", emailErr);
    process.exit(1);
  }

  if (!commandExists("docker")) {
    console.error(
      "Docker не установлен. Установите Docker на сервере:\n" +
        "  https://docs.docker.com/engine/install/ubuntu/"
    );
    process.exit(1);
  }

  const serverIp = await fetchPublicIp();
  if (serverIp) console.log(`→ Публичный IP сервера: ${serverIp}`);

  if (!args.skipDns) {
    const dnsWarnings = await checkDns(domain, serverIp);
    for (const w of dnsWarnings) console.warn("⚠", w);
    if (dnsWarnings.length && !args.yes) {
      const cont = await ask("\nПродолжить несмотря на предупреждения DNS? (y/N): ");
      if (!/^y(es)?$/i.test(cont)) {
        console.log("Отменено. Настройте A-запись и запустите снова.");
        process.exit(0);
      }
    }
  }

  console.log(`\n→ Домен:  ${domain}`);
  console.log(`→ Email:  ${email}`);
  console.log(`→ URL:    https://${domain}`);
  console.log(`→ MySQL:  ${args.mysql ? "да" : "нет (JSON db в volume)"}`);

  if (!args.yes && !args.checkOnly) {
    const ok = await ask("\nЗаписать .env и поднять Docker + Caddy? (Y/n): ");
    if (/^n(o)?$/i.test(ok)) {
      console.log("Отменено.");
      process.exit(0);
    }
  }

  ensureEnv(domain, email);
  console.log(`✓ Обновлён ${path.relative(productRoot, envPath)}`);

  if (args.checkOnly) {
    console.log("\nРежим --check-only: контейнеры не запускались.");
    process.exit(0);
  }

  if (args.ufw) openUfwPorts();

  const composeFiles = ["-f", "docker-compose.yml", "-f", "docker-compose.caddy.yml"];
  if (args.mysql) composeFiles.push("-f", "docker-compose.mysql.yml");

  console.log("\n→ Сборка и запуск контейнеров (это может занять несколько минут)…\n");
  const up = runDockerCompose([...composeFiles, "up", "-d", "--build"], { inherit: true });
  if (!up.ok) {
    console.error("\nОшибка Docker Compose:", up.stderr || `exit ${up.status}`);
    process.exit(1);
  }

  console.log("\n→ Ожидание готовности приложения…");
  const healthy = await waitForHealth(180);
  if (healthy) console.log("✓ /api/health OK");
  else console.warn("⚠ Приложение ещё запускается — проверьте: docker compose logs -f");

  console.log(`
════════════════════════════════════════════════════════
  Готово!

  Откройте:  https://${domain}

  Первый вход: создайте учётную запись администратора.
  Лицензия: код запроса в Настройках → ключ с keyserver.

  Полезные команды:
    docker compose ${composeFiles.filter((f) => f.endsWith(".yml")).map((f) => `-f ${f}`).join(" ")} logs -f
    docker compose ${composeFiles.filter((f) => f.endsWith(".yml")).map((f) => `-f ${f}`).join(" ")} ps

  В Настройках укажите публичный URL: https://${domain}
════════════════════════════════════════════════════════
`);
}

main().catch((err) => {
  console.error("Ошибка:", err.message || err);
  process.exit(1);
});
