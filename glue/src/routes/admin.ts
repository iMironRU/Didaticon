import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Config } from "../config.js";
import type { SettingsStore } from "../store/settings.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require("adm-zip") as new (input: string) => AdmZipInstance;

interface AdmZipInstance {
  extractAllTo(targetPath: string, overwrite: boolean): void;
  getEntries(): { entryName: string }[];
}

// Ключи конфига которые можно менять через admin UI.
// Метки для отображения и признак "требует рестарта".
const CONFIG_KEYS: { key: string; label: string; secret?: boolean; restart?: boolean; html?: boolean }[] = [
  { key: "OIDC_ISSUER",            label: "OIDC Issuer (URL Univerkon)", restart: true },
  { key: "OIDC_CLIENT_ID",         label: "OIDC Client ID (для PWA)", restart: true },
  { key: "OIDC_CLIENT_SECRET",     label: "OIDC Client Secret", secret: true, restart: true },
  { key: "OIDC_REDIRECT_URI",      label: "OIDC Redirect URI (домен/callback)", restart: true },
  { key: "OIDC_JWKS_URL",          label: "JWKS URL (обычно OIDC Issuer + /jwks)", restart: true },
  { key: "OIDC_AUDIENCE",          label: "OIDC Audience", restart: true },
  { key: "UNIVERKON_RPC_URL",       label: "Univerkon JSON-RPC URL" },
  { key: "UNIVERKON_SERVICE_TOKEN", label: "Сервисный токен Univerkon", secret: true },
  { key: "EIOS_DOMAIN",            label: "Домен ЭИОС", restart: true },
  { key: "BRANDING_ACCESS_INFO",   label: "Экран «Как получить доступ» (HTML)", html: true },
  { key: "BRANDING_LK_URL",        label: "Ссылка на личный кабинет (ЛК)" },
];

function requireAdmin(cfg: Config, req: FastifyRequest, reply: FastifyReply): boolean {
  if (!cfg.adminToken) {
    reply.status(403).send({ error: "ADMIN_TOKEN не задан — панель управления отключена" });
    return false;
  }
  const auth = (req.headers.authorization as string | undefined) ?? "";
  if (auth !== `Bearer ${cfg.adminToken}`) {
    reply.status(401).send({ error: "Неверный токен администратора" });
    return false;
  }
  return true;
}

export function registerAdmin(
  app: FastifyInstance,
  { cfg, settings }: { cfg: Config; settings: SettingsStore },
) {
  // ── Статус (без авторизации) ─────────────────────────────────────────────
  app.get("/admin/status", async () => {
    const checks = await Promise.allSettled([
      fetch(cfg.oidcJwksUrl).then((r) => r.ok),
      fetch(cfg.univerkonRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"jsonrpc":"2.0","method":"ping","id":1}',
      }).then((r) => r.ok || r.status < 500),
    ]);
    return {
      glue: true,
      oidc:      checks[0].status === "fulfilled" && checks[0].value,
      univerkon: checks[1].status === "fulfilled" && checks[1].value,
      adminEnabled: !!cfg.adminToken,
      config: {
        domain:       process.env.EIOS_DOMAIN ?? settings.get("EIOS_DOMAIN") ?? "(не задан)",
        oidcIssuer:   cfg.oidcIssuer,
        univerkonRpc: cfg.univerkonRpcUrl,
        store:        cfg.store,
        role:         cfg.role,
      },
    };
  });

  // ── Конфиг: чтение ──────────────────────────────────────────────────────
  app.get("/admin/config", async (req, reply) => {
    if (!requireAdmin(cfg, req, reply)) return;
    const saved = settings.getAll();
    return CONFIG_KEYS.map((k) => ({
      key:     k.key,
      label:   k.label,
      secret:  k.secret ?? false,
      restart: k.restart ?? false,
      html:    k.html ?? false,
      envValue: k.secret ? "****" : (process.env[k.key] ?? ""),
      savedValue: saved[k.key] ?? null,
      effectiveValue: k.secret ? "****" : (saved[k.key] ?? process.env[k.key] ?? ""),
    }));
  });

  // ── Конфиг: сохранение ──────────────────────────────────────────────────
  app.post("/admin/config", async (req, reply) => {
    if (!requireAdmin(cfg, req, reply)) return;
    const body = req.body as Record<string, string>;
    const needsRestart: string[] = [];
    for (const { key, restart } of CONFIG_KEYS) {
      if (key in body) {
        const val = String(body[key]).trim();
        if (val) {
          settings.set(key, val);
          if (restart) needsRestart.push(key);
        } else {
          settings.delete(key);
        }
      }
    }
    return {
      ok: true,
      needsRestart,
      message: needsRestart.length
        ? `Сохранено. Настройки ${needsRestart.join(", ")} вступят в силу после перезапуска стека.`
        : "Сохранено. Настройки применятся при следующем подключении.",
    };
  });

  // ── SCORM: список пакетов ───────────────────────────────────────────────
  app.get("/admin/scorm", async (req, reply) => {
    if (!requireAdmin(cfg, req, reply)) return;
    const scormDir = cfg.scormPath;
    if (!fs.existsSync(scormDir)) return [];
    const entries = fs.readdirSync(scormDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => {
        const indexExists = fs.existsSync(path.join(scormDir, e.name, "index.html"));
        return { id: e.name, hasIndex: indexExists, url: `/scorm/${e.name}/index.html` };
      });
  });

  // ── SCORM: загрузка ZIP ─────────────────────────────────────────────────
  app.post("/admin/scorm", async (req, reply) => {
    if (!requireAdmin(cfg, req, reply)) return;

    const data = await (req as FastifyRequest & { file: () => Promise<{filename: string; toBuffer: () => Promise<Buffer>}> }).file();
    if (!data) return reply.status(400).send({ error: "Файл не получен" });

    const originalName = data.filename;
    const pkgId = path.basename(originalName, ".zip").replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!pkgId) return reply.status(400).send({ error: "Некорректное имя файла" });

    const buf = await data.toBuffer();
    const tmpFile = path.join(os.tmpdir(), `scorm-upload-${Date.now()}.zip`);
    fs.writeFileSync(tmpFile, buf);

    const targetDir = path.join(cfg.scormPath, pkgId);
    fs.mkdirSync(targetDir, { recursive: true });

    try {
      const zip = new AdmZip(tmpFile);
      zip.extractAllTo(targetDir, true);
    } finally {
      fs.unlinkSync(tmpFile);
    }

    const hasIndex = fs.existsSync(path.join(targetDir, "index.html"));
    return { ok: true, id: pkgId, hasIndex, url: `/scorm/${pkgId}/index.html` };
  });

  // ── SCORM: удаление пакета ──────────────────────────────────────────────
  app.delete("/admin/scorm/:id", async (req, reply) => {
    if (!requireAdmin(cfg, req, reply)) return;
    const { id } = req.params as { id: string };
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return reply.status(400).send({ error: "Некорректный id" });
    const targetDir = path.join(cfg.scormPath, id);
    if (!fs.existsSync(targetDir)) return reply.status(404).send({ error: "Пакет не найден" });
    fs.rmSync(targetDir, { recursive: true, force: true });
    return { ok: true };
  });
}
