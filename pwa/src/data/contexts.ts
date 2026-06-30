/**
 * Контексты физика — boot-API `identity.contexts.get` (Block I §8).
 *
 * Хук `useContexts()` загружает один раз при mount, кеширует в module-scope
 * (живёт пока вкладка открыта, перезагружается при reload).
 *
 * Полная переработка под context-state — этап 6 (AppShell).
 */
import { useEffect, useState } from "react";
import { rpc, RpcError } from "./rpc.js";
import { USE_MOCK, DEMO_PERSONA } from "../auth/mock.js";

export interface EducationProgram {
  code:  string;
  title: string;
  level: string;
  form:  string;
}

export interface StudentContext {
  context_id:        string;
  education_program: EducationProgram;
  year_of_admission: number;
  current_semester:  number;
}

export interface ParentContext {
  context_id: string;
  child: {
    fp_id:             string;
    name:              string;
    education_program: EducationProgram;
  };
}

export interface TeacherContext {
  context_id: string;
}

export interface ExaminerContext {
  context_id: string;
  event: { id: string; title: string; dates: { from: string; to: string } };
}

export interface ApplicantContext {
  context_id: string;
  application: { id: string; direction: string; status: string };
}

export interface ContextsResponse {
  student:   StudentContext[];
  parent:    ParentContext[];
  teacher:   TeacherContext[];
  examiner:  ExaminerContext[];
  applicant: ApplicantContext[];
}

const EMPTY: ContextsResponse = { student: [], parent: [], teacher: [], examiner: [], applicant: [] };

/** Demo-моки — для ?demo= режима без реального Auth0-логина.
 *  Совпадают по структуре с glue mocks (та же education_program/группы). */
const DEMO_CONTEXTS: Record<string, ContextsResponse> = {
  student: {
    student: [{
      context_id: "stu:demo-1",
      education_program: {
        code: "09.03.01", title: "Информатика и вычислительная техника",
        level: "bachelor", form: "full_time",
      },
      year_of_admission: 2023, current_semester: 6,
    }],
    parent: [], teacher: [], examiner: [], applicant: [],
  },
  parent: {
    student: [],
    parent: [{
      context_id: "par:demo-1",
      child: {
        fp_id: "fpid:demo-c1",
        name: "Иванов Иван Иванович",
        education_program: {
          code: "09.03.01", title: "Информатика и вычислительная техника",
          level: "bachelor", form: "full_time",
        },
      },
    }],
    teacher: [], examiner: [], applicant: [],
  },
  teacher: {
    student: [], parent: [],
    teacher: [{ context_id: "tch:demo-1" }],
    examiner: [], applicant: [],
  },
};

// Stale-while-revalidate persist:
//  - на mount возвращаем то что есть (cache / localStorage) сразу, без сети
//  - в фоне дёргаем RPC и обновляем
//  - на сетевую ошибку — продолжаем работать с тем что было (stale = true)
//
// Кеш в localStorage переживает F5 и offline-старт PWA с домашнего экрана.

const LS_KEY = "eios_contexts_cache_v1";

let _cache: ContextsResponse | null = null;
let _stale = false;
let _inFlight: Promise<ContextsResponse> | null = null;

function readLs(): ContextsResponse | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) as ContextsResponse : null;
  } catch { return null; }
}

function writeLs(c: ContextsResponse): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* quota / private mode */ }
}

export async function loadContexts(): Promise<ContextsResponse> {
  if (_cache) return _cache;

  // Demo-режим — без RPC и без LS. Возвращаем mock по DEMO_PERSONA.
  if (USE_MOCK) {
    _cache = DEMO_CONTEXTS[DEMO_PERSONA] ?? EMPTY;
    return _cache;
  }

  if (_inFlight) return _inFlight;
  _inFlight = rpc<ContextsResponse>("identity.contexts.get")
    .then((r) => { _cache = r; _stale = false; writeLs(r); return r; })
    .finally(() => { _inFlight = null; });
  return _inFlight;
}

/** Сбросить кеш + localStorage (вызывать при logout). */
export function resetContexts(): void {
  _cache = null;
  _stale = false;
  _inFlight = null;
  try { localStorage.removeItem(LS_KEY); } catch { /* */ }
}

export interface ContextsState {
  contexts: ContextsResponse | null;
  loading:  boolean;
  error:    string | null;
  /** true если данные из localStorage-кеша и свежий RPC не удался.
   *  UI может показать «оффлайн» индикатор. */
  stale:    boolean;
}

export function useContexts(): ContextsState {
  const [state, setState] = useState<ContextsState>(() => {
    if (_cache) return { contexts: _cache, loading: false, error: null, stale: _stale };
    if (USE_MOCK) return { contexts: null, loading: true, error: null, stale: false };
    // Synchronously hydrate из localStorage чтобы AppShell не моргал спиннером
    // на холодном offline-старте — сразу даём stale-данные.
    const ls = readLs();
    if (ls) {
      _cache = ls; _stale = true;
      return { contexts: ls, loading: false, error: null, stale: true };
    }
    return { contexts: null, loading: true, error: null, stale: false };
  });

  useEffect(() => {
    if (USE_MOCK) {
      if (!_cache) {
        _cache = DEMO_CONTEXTS[DEMO_PERSONA] ?? EMPTY;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- demo hydration once
        setState({ contexts: _cache, loading: false, error: null, stale: false });
      }
      return;
    }

    let cancelled = false;
    // Всегда пробуем фоновый refresh — даже если показываем stale.
    rpc<ContextsResponse>("identity.contexts.get")
      .then((c) => {
        if (cancelled) return;
        _cache = c; _stale = false; writeLs(c);
        setState({ contexts: c, loading: false, error: null, stale: false });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // Если в state уже есть данные (из LS-кеша) — оставляем их, помечаем stale
        const msg = e instanceof RpcError ? `${e.message} (${e.code})` : String(e);
        setState((prev) => prev.contexts
          ? { ...prev, stale: true, loading: false, error: null }
          : { contexts: EMPTY, loading: false, error: msg, stale: false });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
