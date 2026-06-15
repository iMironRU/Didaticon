// Brand-типы для идентификаторов: TS не даст перепутать StudentId с EventId
// при передаче в функцию. На рантайме это обычные строки.

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type EventId = Brand<string, "EventId">;
export type StudentId = Brand<string, "StudentId">;
export type AttemptId = Brand<string, "AttemptId">;
export type DidacticUnitId = Brand<string, "DidacticUnitId">;

export const EventId = (s: string): EventId => s as EventId;
export const StudentId = (s: string): StudentId => s as StudentId;
export const AttemptId = (s: string): AttemptId => s as AttemptId;
export const DidacticUnitId = (s: string): DidacticUnitId => s as DidacticUnitId;
