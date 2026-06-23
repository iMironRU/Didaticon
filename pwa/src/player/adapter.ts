// Адаптер: scorm-again перехватывает CMI, мы маршрутизируем коммиты в outbox.
// Прогресс пишется ЛОКАЛЬНО первым (IndexedDB) — 1С/клей лёг, прохождение не встаёт.
// docs/concept-eios.md §6.1, glue-contracts.md §2.
import { Scorm12API, Scorm2004API } from "scorm-again";
import type { CmiSnapshot, LaunchContext } from "@eios/contracts";
import { bufferCommit } from "../offline/outbox.js";

type ScormApi = Scorm12API | Scorm2004API;

/** Смонтировать SCORM API на window и вернуть функцию размонтирования. */
export function mountScormApi(ctx: LaunchContext): () => void {
  const api = buildApi(ctx);
  const w = window as unknown as Record<string, unknown>;

  attachListeners(api, ctx);

  if (ctx.scormVersion === "2004") w.API_1484_11 = api;
  else w.API = api;

  return () => {
    delete w.API;
    delete w.API_1484_11;
  };
}

function buildApi(ctx: LaunchContext): ScormApi {
  const common = {
    // Не говорим scorm-again сетевой URL — сеть ведём сами через IndexedDB-outbox.
    lmsCommitUrl: "",
    autocommit: false,    // коммиты — только по явному вызову SCO
    sendFullCommit: true, // полный снимок CMI, не только дельты
  } as const;

  return ctx.scormVersion === "2004"
    ? new Scorm2004API(common)
    : new Scorm12API(common);
}

function snapshot(api: ScormApi): CmiSnapshot {
  // api.cmi — живой объект scorm-again; берём как есть (клей его сохранит as-is).
  return api.cmi as unknown as CmiSnapshot;
}

function attachListeners(api: ScormApi, ctx: LaunchContext): void {
  const commit = () =>
    void bufferCommit({
      eventId: ctx.eventId,
      attemptId: ctx.attemptId,
      closure: ctx.closure,
      scormVersion: ctx.scormVersion,
      cmi: snapshot(api),
    });

  if (ctx.scormVersion === "2004") {
    // SCORM 2004: Commit + Terminate
    api.on("Commit", commit);
    api.on("Terminate", () => {
      // Финальный снимок — на этом CMI клей проверит границу события.
      commit();
    });
  } else {
    // SCORM 1.2: LMSCommit + LMSFinish
    api.on("LMSCommit", commit);
    api.on("LMSFinish", () => {
      // Финальный снимок — на этом CMI клей проверит границу события.
      commit();
    });
  }
}
