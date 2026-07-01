// Генерирует docs/api/glue.openapi.json из JSON Schema роутов (issue #68).
// Не поднимает реальный сервер (без app.listen()/outbox.startDraining()) —
// только строит Fastify-инстанс, вызывает app.ready() + app.swagger().
// Store/SettingsStore/UniverkonClient — реальные классы на in-memory sqlite,
// но хендлеры роутов не исполняются (только регистрируются), так что
// сетевых вызовов/файлов на диске это не создаёт.
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { makeStore } from "../src/store/index.js";
import { SettingsStore } from "../src/store/settings.js";
import { UniverkonClient } from "../src/univerkon/client.js";
import { Outbox } from "../src/outbox/index.js";
import { buildApp } from "../src/app.js";
import type { Config } from "../src/config.js";

const cfg: Config = {
  port: 0,
  store: "sqlite",
  sqlitePath: ":memory:",
  pgUrl: "",
  role: "central",
  univerkonRpcUrl: "http://stub.local/rpc",
  univerkonServiceToken: "stub",
  oidcIssuer: "https://stub.local",
  oidcJwksUrl: "https://stub.local/jwks",
  oidcAudience: "eios-glue",
  adminToken: "",
  scormPath: "/tmp/scorm-stub",
};

const store = makeStore(cfg);
const settings = new SettingsStore(":memory:");
const univerkon = new UniverkonClient(cfg);
const outbox = new Outbox(store, univerkon);

const app = await buildApp({ cfg, store, settings, univerkon, outbox });
await app.ready();

const schema = app.swagger();

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../../docs/api");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "glue.openapi.json");
writeFileSync(outPath, JSON.stringify(schema, null, 2) + "\n");

console.log(`OpenAPI-схема записана: ${outPath}`);
await app.close();
