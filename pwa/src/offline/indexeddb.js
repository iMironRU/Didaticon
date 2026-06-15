// Durable-буфер браузера (IndexedDB). Запись CMI всегда успешна — основа
// устойчивости (docs/concept-eios.md §6.1, §7).
import { openDB } from "idb";
let dbp = null;
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
export async function enqueue(item) {
    (await db()).add("outbox", item);
}
export async function drain() {
    const d = await db();
    const keys = await d.getAllKeys("outbox");
    const vals = await d.getAll("outbox");
    return keys.map((id, i) => ({ id: id, value: vals[i] }));
}
export async function ack(id) {
    (await db()).delete("outbox", id);
}
