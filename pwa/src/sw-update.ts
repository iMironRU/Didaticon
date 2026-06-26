// Отслеживание обновлений Service Worker.
// Workbox в autoUpdate-режиме регистрирует новый SW но не активирует его сразу —
// ждём события waiting, показываем UI, при подтверждении шлём skipWaiting.

export type SwUpdateState = "idle" | "available";

let _listener: ((s: SwUpdateState) => void) | null = null;
let _waitingWorker: ServiceWorker | null = null;

export function onSwUpdate(cb: (s: SwUpdateState) => void) {
  _listener = cb;
}

export function applySwUpdate() {
  if (_waitingWorker) {
    _waitingWorker.postMessage({ type: "SKIP_WAITING" });
    _waitingWorker = null;
  }
  window.location.reload();
}

export function initSwUpdateCheck() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.ready.then((reg) => {
    // Новый SW уже ждёт активации
    if (reg.waiting) {
      _waitingWorker = reg.waiting;
      _listener?.("available");
    }

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          _waitingWorker = newWorker;
          _listener?.("available");
        }
      });
    });
  });

  // Когда новый SW активировался — перезагружаем страницу
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
