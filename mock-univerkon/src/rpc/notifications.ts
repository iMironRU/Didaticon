import type Database from "better-sqlite3";

export function notificationsGet(db: Database.Database, params: Record<string, unknown>) {
  const { student_id, limit } = params;
  if (!student_id) throw { code: -32602, message: "notifications.get: требуется student_id" };

  const lim = typeof limit === "number" ? limit : 20;
  const rows = db.prepare(`
    SELECT * FROM notifications WHERE student_id=?
    ORDER BY created_at DESC LIMIT ?
  `).all(student_id, lim) as Array<{
    id: string; type: string; title: string; body: string; read: number; created_at: string;
  }>;

  return {
    student_id,
    notifications: rows.map(r => ({
      id:         r.id,
      type:       r.type,
      title:      r.title,
      body:       r.body,
      read:       r.read === 1,
      created_at: r.created_at,
    })),
    unread_count: (db.prepare("SELECT COUNT(*) as n FROM notifications WHERE student_id=? AND read=0").get(student_id) as { n: number }).n,
  };
}

export function notificationsMarkRead(db: Database.Database, params: Record<string, unknown>) {
  const { student_id, notification_ids } = params;
  if (!student_id) throw { code: -32602, message: "notifications.markRead: требуется student_id" };
  if (!Array.isArray(notification_ids)) throw { code: -32602, message: "notifications.markRead: требуется notification_ids[]" };

  const placeholders = (notification_ids as string[]).map(() => "?").join(",");
  if (placeholders) {
    db.prepare(`UPDATE notifications SET read=1 WHERE student_id=? AND id IN (${placeholders})`).run(student_id, ...(notification_ids as string[]));
  }
  return { ok: true, marked: notification_ids.length };
}
