// Сервис-клей. Фасад слоя активности (docs/glue-contracts.md).
// Univerkon видит только свидетельства; форма хранения за фасадом.
import Fastify from "fastify";
import { loadConfig } from "./config.js";
import { makeStore } from "./store/index.js";
import { Outbox } from "./outbox/index.js";
import { UniverkonClient } from "./univerkon/client.js";
import { registerCommit } from "./routes/commit.js";
import { registerResume } from "./routes/resume.js";

const cfg = loadConfig();
const app = Fastify({ logger: true });

const store = makeStore(cfg);
const univerkon = new UniverkonClient(cfg);
// Нижний буфер: outbox клей→Univerkon. Лёг Univerkon — свидетельство ждёт здесь.
const outbox = new Outbox(store, univerkon);

registerCommit(app, { cfg, store, outbox });
registerResume(app, { cfg, store });

app.get("/healthz", async () => ({ ok: true, role: cfg.role }));

app.listen({ port: cfg.port, host: "0.0.0.0" }).then(() => {
  outbox.startDraining(); // фоновая проводка с ретраями
});
