import { enqueue, drain, ack } from "./indexeddb.js";
import { token } from "../auth/oidc.js";
let seq = 0;
export async function bufferCommit(args) {
    await enqueue({ ...args, sequence: ++seq });
    void flush();
}
export async function flush() {
    const t = await token();
    if (!t)
        return;
    for (const { id, value } of await drain()) {
        const v = value;
        const body = { ...v, credential: { kind: "oidc", value: t } };
        try {
            const r = await fetch("/api/commit", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            });
            if (r.ok)
                await ack(id);
        }
        catch {
            // 1С/клей недоступны — оставляем в буфере, ретрай позже (прогресс не встаёт)
            break;
        }
    }
}
