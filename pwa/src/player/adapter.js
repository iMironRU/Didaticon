// Адаптер: scorm-again перехватывает CMI, мы маршрутизируем коммиты в outbox.
// Прогресс пишется ЛОКАЛЬНО первым (IndexedDB) — 1С/клей лёг, прохождение не встаёт.
// docs/concept-eios.md §6.1, glue-contracts.md §2.
import { Scorm12API } from "scorm-again";
import { bufferCommit } from "../offline/outbox.js";
export function mountScormApi(ctx) {
    // TODO(срез-1): выбрать Scorm12API/Scorm2004API по версии пакета; включить
    //   офлайн-режим scorm-again; на commit-событие — bufferCommit(ctx, cmi).
    const api = new Scorm12API({});
    api.on("LMSCommit", () => {
        void bufferCommit({ eventId: ctx.eventId, attemptId: ctx.attemptId, cmi: api.cmi });
    });
    window.API = api;
    return () => {
        delete window.API;
    };
}
