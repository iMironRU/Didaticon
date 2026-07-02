/**
 * event.get / event.state (Block III §4, §10, §15.1, issue #80) — mock-модель
 * учебного события. Registration-based модель состояний, зафиксирована v0.4.
 *
 * Когда подключим реальный Univerkon — event.get станет проекцией над
 * его schedule-данными + локальным attendance/registration стейтом,
 * а не статичным mock-объектом.
 */
import type { JWTPayload } from "jose";
import { RpcValidationError } from "./rpcError.js";

type EventState =
  | "запланировано" | "регистрация" | "регистрация_закрыта"
  | "идёт" | "завершено" | "перенесено";

interface EventModel {
  id:                        string;
  state:                     EventState;
  discipline_id:             string;
  discipline_title:          string;
  event_kind:                string;
  planned_start_at:          string;
  planned_end_at:            string;
  registration_opened_at:    string | null;
  actually_started_at:       string | null;
  actually_ended_at:         string | null;
  postponed_at:              string | null;
  postponement_reason_code:  string | null;
  replacement_event_id:      string | null;
  format:                    "offline" | "online" | "hybrid";
  room:                      string | null;
  meeting_url:                string | null;
  groups:                    Array<{ group_id: string; title: string; count: number }>;
  package_ref:               string | null;
  teacher:                   { context_id: string; name: string };
}

interface EventParams {
  event_id?: string;
}

function offsetISO(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

// Mock-события для всех 6 состояний (§4). id пересекаются с feed-get.ts,
// где это осмысленно (evt:mock-1, evt:tch-mock-1, evt:mock-os-lec,
// evt:tch-mock-sem) — карточка дашборда и карточка события ссылаются
// на один и тот же mock-объект.
function getMockEvents(): Record<string, EventModel> {
  const teacherAsd = { context_id: "tch:instr-1", name: "Петров В.А." };
  const teacherOs  = { context_id: "tch:instr-2", name: "Сидорова Н.И." };

  return {
    "evt:mock-1": {
      id: "evt:mock-1",
      state: "запланировано",
      discipline_id: "disc:asd",
      discipline_title: "Алгоритмы и структуры данных",
      event_kind: "lecture",
      planned_start_at: offsetISO(75),
      planned_end_at: offsetISO(75 + 90),
      registration_opened_at: null,
      actually_started_at: null,
      actually_ended_at: null,
      postponed_at: null,
      postponement_reason_code: null,
      replacement_event_id: null,
      format: "offline",
      room: "301",
      meeting_url: null,
      groups: [{ group_id: "grp:asd-21", title: "ИВТ-21", count: 24 }],
      package_ref: "pkg:asd-lec-5",
      teacher: teacherAsd,
    },
    "evt:tch-mock-1": {
      id: "evt:tch-mock-1",
      state: "регистрация",
      discipline_id: "disc:asd",
      discipline_title: "Алгоритмы и структуры данных",
      event_kind: "lecture",
      planned_start_at: offsetISO(20),
      planned_end_at: offsetISO(20 + 90),
      registration_opened_at: offsetISO(-10),
      actually_started_at: null,
      actually_ended_at: null,
      postponed_at: null,
      postponement_reason_code: null,
      replacement_event_id: null,
      format: "offline",
      room: "301",
      meeting_url: null,
      groups: [
        { group_id: "grp:asd-21", title: "ИВТ-21", count: 24 },
        { group_id: "grp:asd-22", title: "ИВТ-22", count: 22 },
      ],
      package_ref: "pkg:asd-lec-5",
      teacher: teacherAsd,
    },
    "evt:mock-reg-closed": {
      id: "evt:mock-reg-closed",
      state: "регистрация_закрыта",
      discipline_id: "disc:dm",
      discipline_title: "Дискретная математика",
      event_kind: "seminar",
      planned_start_at: offsetISO(-2),
      planned_end_at: offsetISO(-2 + 90),
      registration_opened_at: offsetISO(-17),
      actually_started_at: null,
      actually_ended_at: null,
      postponed_at: null,
      postponement_reason_code: null,
      replacement_event_id: null,
      format: "offline",
      room: "204",
      meeting_url: null,
      groups: [{ group_id: "grp:dm-1", title: "ИС-21-1", count: 25 }],
      package_ref: "pkg:dm-sem-3",
      teacher: teacherOs,
    },
    "evt:mock-active": {
      id: "evt:mock-active",
      state: "идёт",
      discipline_id: "disc:dm",
      discipline_title: "Дискретная математика",
      event_kind: "seminar",
      planned_start_at: offsetISO(-32),
      planned_end_at: offsetISO(-32 + 90),
      registration_opened_at: offsetISO(-47),
      actually_started_at: offsetISO(-30),
      actually_ended_at: null,
      postponed_at: null,
      postponement_reason_code: null,
      replacement_event_id: null,
      format: "offline",
      room: "204",
      meeting_url: null,
      groups: [{ group_id: "grp:dm-1", title: "ИС-21-1", count: 25 }],
      package_ref: "pkg:dm-sem-3",
      teacher: teacherOs,
    },
    "evt:mock-os-lec": {
      id: "evt:mock-os-lec",
      state: "завершено",
      discipline_id: "disc:os",
      discipline_title: "Операционные системы",
      event_kind: "lecture",
      planned_start_at: offsetISO(-7 * 24 * 60),
      planned_end_at: offsetISO(-7 * 24 * 60 + 90),
      registration_opened_at: offsetISO(-7 * 24 * 60 - 15),
      actually_started_at: offsetISO(-7 * 24 * 60 + 2),
      actually_ended_at: offsetISO(-7 * 24 * 60 + 88),
      postponed_at: null,
      postponement_reason_code: null,
      replacement_event_id: null,
      format: "offline",
      room: "412",
      meeting_url: null,
      groups: [{ group_id: "grp:os-1", title: "ИВТ-31", count: 20 }],
      package_ref: "pkg:os-lec-9",
      teacher: teacherOs,
    },
    "evt:tch-mock-sem": {
      id: "evt:tch-mock-sem",
      state: "перенесено",
      discipline_id: "disc:asd",
      discipline_title: "Алгоритмы и структуры данных",
      event_kind: "seminar",
      planned_start_at: offsetISO(-24 * 60),
      planned_end_at: offsetISO(-24 * 60 + 90),
      registration_opened_at: offsetISO(-24 * 60 - 15),
      actually_started_at: null,
      actually_ended_at: null,
      postponed_at: offsetISO(-24 * 60 + 5),
      postponement_reason_code: "teacher_illness",
      replacement_event_id: null,
      format: "offline",
      room: "301",
      meeting_url: null,
      groups: [{ group_id: "grp:asd-21", title: "ИВТ-21", count: 24 }],
      package_ref: "pkg:asd-sem-2",
      teacher: teacherAsd,
    },
  };
}

function lookupEvent(params: Record<string, unknown>): EventModel {
  const { event_id } = params as EventParams;
  if (!event_id || typeof event_id !== "string") {
    throw new RpcValidationError("event_id обязателен и должен быть строкой", "event_id");
  }
  const event = getMockEvents()[event_id];
  if (!event) {
    throw new RpcValidationError(`Событие не найдено: ${event_id}`, "event_id");
  }
  return event;
}

export async function eventGet(params: Record<string, unknown>, _claims: JWTPayload): Promise<EventModel> {
  return lookupEvent(params);
}

// Отдельный метод для дешёвого polling (§15.1, §17.4) — без остальных полей.
export async function eventState(params: Record<string, unknown>, _claims: JWTPayload): Promise<{ state: EventState }> {
  return { state: lookupEvent(params).state };
}
