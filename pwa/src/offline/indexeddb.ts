// Durable-буфер браузера (IndexedDB). Запись CMI всегда успешна — основа
// устойчивости (docs/concept-eios.md §6.1, §7).
// v2: добавлен store projections (stale-while-revalidate, §6.2).
import { openDB, type IDBPDatabase } from "idb";
import type { TrajectoryProjection, StudentId } from "@eios/contracts";

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbp) {
    dbp = openDB("eios", 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
          d.createObjectStore("resume"); // key: `${eventId}:${attemptId}`
        }
        if (oldVersion < 2) {
          d.createObjectStore("projections"); // key: studentId
        }
      },
    });
  }
  return dbp;
}

// --- outbox (CMI коммиты) ---

export async function enqueue(item: unknown): Promise<void> {
  await (await db()).add("outbox", item as never);
}
export async function drain(): Promise<{ id: number; value: unknown }[]> {
  const d = await db();
  const keys = await d.getAllKeys("outbox");
  const vals = await d.getAll("outbox");
  return keys.map((id, i) => ({ id: id as number, value: vals[i] }));
}
export async function ack(id: number): Promise<void> {
  await (await db()).delete("outbox", id);
}

// --- projections (stale-while-revalidate, §6.2) ---

export async function getCachedProjection(
  studentId: StudentId,
): Promise<TrajectoryProjection | undefined> {
  return (await db()).get("projections", studentId);
}

export async function putCachedProjection(
  studentId: StudentId,
  p: TrajectoryProjection,
): Promise<void> {
  await (await db()).put("projections", p, studentId);
}
