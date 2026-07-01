// Сборка Fastify-инстанса — вынесено из index.ts (issue #68), чтобы
// scripts/generate-openapi.ts могло построить app.swagger() без реального
// запуска сервера (без app.listen(), без outbox.startDraining()).
import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import type { Config } from "./config.js";
import type { Store } from "./store/index.js";
import type { SettingsStore } from "./store/settings.js";
import type { UniverkonClient } from "./univerkon/client.js";
import type { Outbox } from "./outbox/index.js";
import { registerCommit } from "./routes/commit.js";
import { registerResume } from "./routes/resume.js";
import { registerProjection } from "./routes/projection.js";
import { registerAdmin } from "./routes/admin.js";
import { registerRpc } from "./routes/rpc.js";
import { AuthError } from "./auth/index.js";
import { sendProblem, Problems } from "./errors.js";

export interface AppDeps {
  cfg:       Config;
  store:     Store;
  settings:  SettingsStore;
  univerkon: UniverkonClient;
  outbox:    Outbox;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const { cfg, store, settings, univerkon, outbox } = deps;
  const app = Fastify({ logger: true });

  await app.register(multipart, { limits: { fileSize: 200 * 1024 * 1024 } }); // 200 МБ макс

  // OpenAPI-схема из JSON Schema роутов (issue #68). Раздаём JSON генератором
  // scripts/generate-openapi.ts, runtime Swagger UI сознательно не поднимаем
  // (needs-decision в issue: статичный json дешевле и безопаснее в проде).
  await app.register(swagger, {
    openapi: {
      info: { title: "ЭИОС glue API", version: process.env.npm_package_version ?? "0.1.0" },
    },
  });

  // Единая точка для всех REST-ответов об ошибках — RFC 9457 Problem Details
  // (issue #66). /rpc сюда не попадает — там свой JSON-RPC error handling
  // внутри routes/rpc.ts, до этого хендлера долетают только REST-роуты.
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AuthError) return sendProblem(reply, Problems.authRejected(err.message));
    // Fastify сам провалидировал body/query по JSON Schema роута (issue #68)
    // и бросил сюда ДО хендлера — err.validation всегда массив ajv-ошибок.
    // Это 400 (клиент прислал не то), а не 500 (сервер сломался).
    if (err.validation) return sendProblem(reply, Problems.validation(err.message));
    sendProblem(reply, Problems.internal(err.message));
  });

  registerCommit(app, { cfg, store, outbox });
  registerResume(app, { cfg, store });
  registerProjection(app, { cfg, univerkon });
  registerAdmin(app, { cfg, settings });
  registerRpc(app, { cfg });

  // Публичный эндпоинт — PWA читает без авторизации для рендера экрана входа.
  app.get("/branding", async () => {
    const accessInfo  = settings.get("BRANDING_ACCESS_INFO");
    const lkUrl       = settings.get("BRANDING_LK_URL");
    const orgName     = settings.get("BRANDING_ORG_NAME");
    const brandColor  = settings.get("BRANDING_COLOR");
    const logoUrl     = settings.get("BRANDING_LOGO_URL");
    const supportEmail = settings.get("BRANDING_SUPPORT_EMAIL");
    const supportPhone = settings.get("BRANDING_SUPPORT_PHONE");
    const supportHours = settings.get("BRANDING_SUPPORT_HOURS");
    const footerText  = settings.get("BRANDING_FOOTER_TEXT");
    const personIdLabel = settings.get("BRANDING_PERSON_ID_LABEL");
    const lessonRatingRaw = settings.get("LESSON_RATING_ENABLED");
    const demoEnabledRaw  = settings.get("DEMO_LOGIN_ENABLED");
    const oidcIssuer  = settings.get("OIDC_ISSUER")       ?? cfg.oidcIssuer  ?? null;
    const oidcClientId = settings.get("OIDC_CLIENT_ID")   ?? null;
    const oidcRedirectUri = settings.get("OIDC_REDIRECT_URI") ?? null;
    return {
      accessInfo:   accessInfo   ?? null,
      lkUrl:        lkUrl        ?? null,
      orgName:      orgName      ?? null,
      brandColor:   brandColor   ?? null,
      logoUrl:      logoUrl      ?? null,
      supportEmail: supportEmail ?? null,
      supportPhone: supportPhone ?? null,
      supportHours: supportHours ?? null,
      footerText:   footerText   ?? null,
      personIdLabel: personIdLabel ?? null,
      lessonRatingEnabled: lessonRatingRaw != null ? lessonRatingRaw !== "false" : null,
      demoEnabled:         demoEnabledRaw  != null ? demoEnabledRaw  !== "false" : false,
      oidcEnabled: !!(oidcIssuer && oidcClientId),
      oidc: oidcIssuer ? { issuer: oidcIssuer, clientId: oidcClientId, redirectUri: oidcRedirectUri } : null,
    };
  });

  app.get("/healthz", async () => ({ ok: true, role: cfg.role, version: process.env.npm_package_version ?? "0.1.0" }));

  app.post("/admin/restart", async (req, reply) => {
    const token = (req.headers["x-admin-token"] as string) ?? "";
    if (!cfg.adminToken || token !== cfg.adminToken) {
      return sendProblem(reply, Problems.adminUnauthorized());
    }
    reply.send({ ok: true, message: "Перезапуск через 300мс…" });
    setTimeout(() => process.exit(0), 300);
  });

  return app;
}
