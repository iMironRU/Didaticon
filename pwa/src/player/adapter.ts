// Адаптер: scorm-again перехватывает CMI, мы маршрутизируем коммиты в outbox.
// Прогресс пишется ЛОКАЛЬНО первым (IndexedDB) — 1С/клей лёг, прохождение не встаёт.
// docs/concept-eios.md §6.1, glue-contracts.md §2.
import { Scorm12API, Scorm2004API } from "scorm-again";
import type { CmiSnapshot, LaunchContext } from "@eios/contracts";
import { bufferCommit } from "../offline/outbox.js";

export function mountScormApi(ctx: LaunchContext): () => void {
  // TODO(срез-1): включить офлайн-режим scorm-again полностью; перехват commit-события.
  const api = ctx.scormVersion === "2004" ? new Scorm2004API({}) : new Scorm12API({});
  api.on("LMSCommit", () => {
    void bufferCommit({
      eventId: ctx.eventId,
      attemptId: ctx.attemptId,
      closure: ctx.closure,
      cmi: api.cmi as unknown as CmiSnapshot,
    });
  });
  const w = window as unknown as { API?: unknown; API_1484_11?: unknown };
  if (ctx.scormVersion === "2004") w.API_1484_11 = api;
  else w.API = api;
  return () => {
    delete w.API;
    delete w.API_1484_11;
  };
}
