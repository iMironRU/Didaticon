import type Database from "better-sqlite3";

export function scheduleGet(db: Database.Database, params: Record<string, unknown>) {
  const { student_id, from, to } = params;
  if (!student_id) throw { code: -32602, message: "schedule.get: требуется student_id" };

  const rows = db.prepare(`
    SELECT * FROM schedule_slots
    WHERE person_id=? AND person_type='student'
      AND starts_at >= ? AND starts_at < ?
    ORDER BY starts_at
  `).all(student_id, from ?? "2000-01-01", to ?? "2100-01-01") as Array<{
    id: string; starts_at: string; ends_at: string;
    discipline_title: string; slot_kind: string; teacher_name: string | null;
    format: string; room: string | null; meeting_url: string | null;
  }>;

  return {
    student_id,
    slots: rows.map(r => ({
      slot_id:          r.id,
      starts_at:        r.starts_at,
      ends_at:          r.ends_at,
      discipline_title: r.discipline_title,
      slot_kind:        r.slot_kind,
      teacher_name:     r.teacher_name,
      format:           r.format,
      room:             r.room,
      meeting_url:      r.meeting_url,
    })),
  };
}
