// Brand-типы для идентификаторов: TS не даст перепутать StudentId с EventId
// при передаче в функцию. На рантайме это обычные строки.

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

// SCORM-слой (используется в CommitRequest, Svidetelstvo, LaunchContext)
export type EventId        = Brand<string, "EventId">;
export type StudentId      = Brand<string, "StudentId">; // = LearnerId в SCORM-контексте
export type AttemptId      = Brand<string, "AttemptId">;
export type DidacticUnitId = Brand<string, "DidacticUnitId">;

// Доменный слой (траектория, расписание, зачётка, уведомления)
export type PersonId       = Brand<string, "PersonId">;       // физическое лицо (OIDC sub)
export type LearnerId      = Brand<string, "LearnerId">;      // запись контингента
export type UnitId         = Brand<string, "UnitId">;         // единица учебного плана
export type SlotId         = Brand<string, "SlotId">;         // занятие в расписании
export type NotificationId = Brand<string, "NotificationId">;
export type ObligationId   = Brand<string, "ObligationId">;   // отложенное обязательство

export const EventId        = (s: string): EventId        => s as EventId;
export const StudentId      = (s: string): StudentId      => s as StudentId;
export const AttemptId      = (s: string): AttemptId      => s as AttemptId;
export const DidacticUnitId = (s: string): DidacticUnitId => s as DidacticUnitId;
export const PersonId       = (s: string): PersonId       => s as PersonId;
export const LearnerId      = (s: string): LearnerId      => s as LearnerId;
export const UnitId         = (s: string): UnitId         => s as UnitId;
export const SlotId         = (s: string): SlotId         => s as SlotId;
export const NotificationId = (s: string): NotificationId => s as NotificationId;
export const ObligationId   = (s: string): ObligationId   => s as ObligationId;
