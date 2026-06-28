/**
 * PWA install prompt — capture beforeinstallprompt + iOS detection.
 *
 * Browsers (Chrome/Edge/Samsung): emit `beforeinstallprompt` once. Мы ловим
 * раз и сохраняем, чтобы вызвать .prompt() по кнопке юзера.
 *
 * iOS Safari: НЕ имеет beforeinstallprompt. Показываем подсказку как
 * вручную добавить (Share → На главный экран).
 *
 * Detection "уже установлено": display-mode standalone или navigator.standalone.
 */
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _deferred: BeforeInstallPromptEvent | null = null;
const _listeners = new Set<() => void>();

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();   // не показывать стандартный браузерный баннер
  _deferred = e as BeforeInstallPromptEvent;
  _listeners.forEach((cb) => cb());
});

window.addEventListener("appinstalled", () => {
  _deferred = null;
  _listeners.forEach((cb) => cb());
});

export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as { standalone?: boolean }).standalone === true;
}

export function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !("MSStream" in window);
}

export interface InstallState {
  /** Уже работает как PWA — кнопку не показываем */
  installed:  boolean;
  /** Можно показать кнопку "Установить" (Chrome/Edge captured beforeinstallprompt) */
  canInstall: boolean;
  /** iOS Safari — показать инструкцию вместо кнопки */
  isIOS:      boolean;
  /** Триггерит prompt. Возвращает true если юзер принял. */
  install:    () => Promise<boolean>;
}

export function useInstallPrompt(): InstallState {
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    _listeners.add(cb);
    return () => { _listeners.delete(cb); };
  }, []);

  return {
    installed:  isStandalone(),
    canInstall: _deferred !== null,
    isIOS:      isIOS(),
    install:    async () => {
      if (!_deferred) return false;
      await _deferred.prompt();
      const { outcome } = await _deferred.userChoice;
      _deferred = null;
      _listeners.forEach((cb) => cb());
      return outcome === "accepted";
    },
  };
}
