/**
 * e-Student токен (Block I §9) — кеш + ленивая загрузка с RPC.
 *
 * Запрашивается через JSON-RPC `identity.e_student.issue`. Возвращается
 * подписанный JWS на 24ч. Кешируется в localStorage, чтобы:
 *  - открывать карту в офлайне (охранник сканирует QR без сети)
 *  - не дёргать API каждый раз
 *
 * Если cached.exp < now → дёргаем заново.
 */
import { rpc } from "./rpc.js";
import { USE_MOCK } from "../auth/mock.js";

export interface EStudentPayload {
  iss:        string;
  sub:        string;
  ctx:        string;
  name:       string;
  photo_url:  string | null;
  education_program: { code: string; title: string; level: string; form: string };
  year_of_admission: number;
  current_year:      number;
  iat:        number;
  exp:        number;
}

export interface EStudent {
  token:   string;
  exp:     number;
  payload: EStudentPayload;
}

const KEY_PREFIX = "eios_estudent_";

function cacheKey(contextId: string): string {
  return KEY_PREFIX + contextId;
}

function readCache(contextId: string): EStudent | null {
  try {
    const raw = localStorage.getItem(cacheKey(contextId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EStudent;
    if (!parsed.exp || parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(contextId: string, value: EStudent): void {
  localStorage.setItem(cacheKey(contextId), JSON.stringify(value));
}

/** Получить актуальный e-Student токен — из кеша или свежий через RPC. */
export async function loadEStudent(contextId: string): Promise<EStudent> {
  const cached = readCache(contextId);
  if (cached) return cached;

  if (USE_MOCK) {
    // Демо-режим — генерируем фиктивный токен локально, без сети.
    // Реальная подпись не нужна, QR показывает строку токена для демонстрации UX.
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 24 * 60 * 60;
    const payload: EStudentPayload = {
      iss:  "https://didacticon.test/estudent",
      sub:  "fpid:demo-001",
      ctx:  contextId,
      name: "Иванов Иван Иванович",
      photo_url: null,
      education_program: {
        code: "09.03.01", title: "Информатика и вычислительная техника",
        level: "bachelor", form: "full_time",
      },
      year_of_admission: 2023, current_year: 3,
      iat: now, exp,
    };
    const fakeToken = `demo.${btoa(JSON.stringify(payload))}.signature`;
    const data: EStudent = { token: fakeToken, exp, payload };
    writeCache(contextId, data);
    return data;
  }

  const fresh = await rpc<EStudent>("identity.e_student.issue", { student_context_id: contextId });
  writeCache(contextId, fresh);
  return fresh;
}

/** Принудительное обновление (для кнопки "Обновить" если истёк). */
export async function refreshEStudent(contextId: string): Promise<EStudent> {
  localStorage.removeItem(cacheKey(contextId));
  return loadEStudent(contextId);
}
