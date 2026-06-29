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

let _cache: ContextsResponse | null = null;
let _inFlight: Promise<ContextsResponse> | null = null;

export async function loadContexts(): Promise<ContextsResponse> {
  if (_cache) return _cache;

  // Demo-режим — без RPC. Возвращаем mock по DEMO_PERSONA.
  // Старый Auth0 access_token может торчать в localStorage от прошлой сессии,
  // но дёргать его в demo бессмысленно — glue его отклонит.
  if (USE_MOCK) {
    _cache = DEMO_CONTEXTS[DEMO_PERSONA] ?? EMPTY;
    return _cache;
  }

  if (_inFlight) return _inFlight;
  _inFlight = rpc<ContextsResponse>("identity.contexts.get")
    .then((r) => { _cache = r; return r; })
    .finally(() => { _inFlight = null; });
  return _inFlight;
}

/** Сбросить кеш (вызывать при logout). */
export function resetContexts(): void {
  _cache = null;
  _inFlight = null;
}

export interface ContextsState {
  contexts: ContextsResponse | null;
  loading:  boolean;
  error:    string | null;
}

export function useContexts(): ContextsState {
  const [state, setState] = useState<ContextsState>(() => ({
    contexts: _cache,
    loading:  _cache === null,
    error:    null,
  }));

  useEffect(() => {
    if (_cache) return;
    let cancelled = false;
    loadContexts()
      .then((c) => { if (!cancelled) setState({ contexts: c, loading: false, error: null }); })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof RpcError ? `${e.message} (${e.code})` : String(e);
        setState({ contexts: EMPTY, loading: false, error: msg });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
