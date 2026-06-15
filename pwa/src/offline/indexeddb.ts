// Durable-буфер браузера (IndexedDB). Запись CMI всегда успешна — основа
// устойчивости (docs/concept-eios.md §6.1, §7).
import { openDB, type IDBPDatabase } from "idb";

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbp) {
    dbp = openDB("eios", 1, {
      upgrade(d) {
        d.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
        d.createObjectStore("resume"); // key: `${eventId}:${attemptId}`
      },
    });
  }
  return dbp;
}

export async function enqueue(item: unknown): Promise<void> {
  (await db()).add("outbox", item as never);
}
export async function drain(): Promise<{ id: number; value: unknown }[]> {
  const d = await db();
  const keys = await d.getAllKeys("outbox");
  const vals = await d.getAll("outbox");
  return keys.map((id, i) => ({ id: id as number, value: vals[i] }));
}
export async function ack(id: number): Promise<void> {
  (await db()).delete("outbox", id);
}
