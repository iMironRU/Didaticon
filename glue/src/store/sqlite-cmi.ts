import type { Store, SvidetelstvoRecord } from "./index.js";

// Тонкий CMI-снимок на (eventId, attemptId). Без трансляции в xAPI (SCORM-only).
// TODO(срез-1): better-sqlite3 — таблицы cmi(event,attempt,seq,json) и
//   svidetelstvo_outbox(event,attempt,payload,sent). Реальная реализация.
export class SqliteCmiStore implements Store {
  constructor(private path: string) {}

  async putCmi(): Promise<void> {
    throw new Error("TODO(срез-1)");
  }
  async getCmi(): Promise<Record<string, unknown> | null> {
    throw new Error("TODO(срез-1)");
  }
  async enqueueSvidetelstvo(_rec: SvidetelstvoRecord): Promise<void> {
    throw new Error("TODO(срез-1)");
  }
  async takePendingSvidetelstva(): Promise<SvidetelstvoRecord[]> {
    return [];
  }
  async markSvidetelstvoSent(): Promise<void> {
    throw new Error("TODO(срез-1)");
  }
}
