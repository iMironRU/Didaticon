// Сервис-клей. Фасад слоя активности (docs/glue-contracts.md).
// Univerkon видит только свидетельства; форма хранения за фасадом.
// Сборка Fastify-инстанса — в app.ts (переиспользуется generate-openapi.ts).
import { loadConfig } from "./config.js";
import { makeStore } from "./store/index.js";
import { SettingsStore } from "./store/settings.js";
import { Outbox } from "./outbox/index.js";
import { UniverkonClient } from "./univerkon/client.js";
import { buildApp } from "./app.js";

const cfg = loadConfig();
const store = makeStore(cfg);
const settings = new SettingsStore(cfg.sqlitePath);
const univerkon = new UniverkonClient(cfg);
// Нижний буфер: outbox клей→Univerkon. Лёг Univerkon — свидетельство ждёт здесь.
const outbox = new Outbox(store, univerkon);

const app = await buildApp({ cfg, store, settings, univerkon, outbox });

app.listen({ port: cfg.port, host: "0.0.0.0" }).then(() => {
  outbox.startDraining(); // фоновая проводка с ретраями
});
