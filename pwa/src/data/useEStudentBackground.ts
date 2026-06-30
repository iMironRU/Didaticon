/**
 * Проактивный refresh e-Student JWS (docs/didakticon-online-offline.md §7.2).
 *
 * При запуске PWA с сетью + при возвращении сети — для каждого student-контекста
 * проверяем срок текущего токена в LS. Если до `exp` меньше 12 часов → дёргаем
 * `identity.e_student.issue` в фоне.
 *
 * Эффект: студент в течение дня всегда имеет свежий или почти свежий e-Student
 * без визуальной активности. Open карты в офлайн = валидный QR.
 */
import { useEffect } from "react";
import { refreshEStudent } from "./eStudent.js";
import { useOnline } from "../useOnline.js";
import type { ContextsResponse } from "./contexts.js";

const REFRESH_THRESHOLD_SEC = 12 * 60 * 60;  // <12ч до exp → refresh
const LS_PREFIX = "eios_estudent_";

interface CachedToken {
  exp: number;  // unix seconds
}

function shouldRefresh(contextId: string, nowSec: number): boolean {
  try {
    const raw = localStorage.getItem(LS_PREFIX + contextId);
    if (!raw) return true;  // нет токена — точно надо
    const parsed = JSON.parse(raw) as CachedToken;
    if (!parsed.exp) return true;
    return (parsed.exp - nowSec) < REFRESH_THRESHOLD_SEC;
  } catch {
    return true;
  }
}

export function useEStudentBackground(contexts: ContextsResponse | null, enabled: boolean): void {
  const online = useOnline();

  useEffect(() => {
    if (!enabled || !online || !contexts) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const targets = contexts.student
      .map((c) => c.context_id)
      .filter((cid) => shouldRefresh(cid, nowSec));

    if (targets.length === 0) return;

    // Тихий refresh, без UI. Любую ошибку проглатываем — есть кеш, юзер
    // сможет показать существующий QR. Реальная ошибка всплывёт при
    // открытии карты.
    for (const cid of targets) {
      void refreshEStudent(cid).catch(() => { /* silent */ });
    }
  }, [contexts, online, enabled]);
}
