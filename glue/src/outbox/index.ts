// Нижний буфер: outbox клей→Univerkon. Univerkon вне горячего пути —
// лёг Univerkon, свидетельство ждёт здесь и доливается с ретраями.
import type { Store } from "../store/index.js";
import type { UniverkonClient } from "../univerkon/client.js";

export class Outbox {
  constructor(private store: Store, private univerkon: UniverkonClient) {}

  startDraining(): void {
    // TODO(срез-1): периодически takePendingSvidetelstva → depositSvidetelstvo →
    //   markSvidetelstvoSent; экспоненциальный бэкофф при ошибке.
    setInterval(() => void this.drainOnce(), 5000);
  }

  private async drainOnce(): Promise<void> {
    const pending = await this.store.takePendingSvidetelstva(50);
    for (const rec of pending) {
      try {
        await this.univerkon.depositSvidetelstvo({ ...rec });
        await this.store.markSvidetelstvoSent(rec.eventId, rec.attemptId);
      } catch {
        // оставляем в очереди — ретрай на следующем тике
      }
    }
  }
}
