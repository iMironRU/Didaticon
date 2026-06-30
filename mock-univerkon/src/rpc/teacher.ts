import type Database from "better-sqlite3";

export function teacherScheduleGet(db: Database.Database, params: Record<string, unknown>) {
  const { teacher_id, from, to } = params;
  if (!teacher_id) throw { code: -32602, message: "teacher.schedule.get: требуется teacher_id" };

  const rows = db.prepare(`
    SELECT * FROM schedule_slots
    WHERE person_id=? AND person_type='teacher'
      AND starts_at >= ? AND starts_at < ?
    ORDER BY starts_at
  `).all(teacher_id, from ?? "2000-01-01", to ?? "2100-01-01") as Array<{
    id: string; starts_at: string; ends_at: string;
    discipline_title: string; slot_kind: string;
    group_name: string | null; format: string; room: string | null; meeting_url: string | null;
  }>;

  return {
    teacher_id,
    slots: rows.map(r => ({
      slot_id:          r.id,
      starts_at:        r.starts_at,
      ends_at:          r.ends_at,
      discipline_title: r.discipline_title,
      slot_kind:        r.slot_kind,
      group_name:       r.group_name,
      format:           r.format,
      room:             r.room,
      meeting_url:      r.meeting_url,
    })),
  };
}

export function teacherAttendanceGet(db: Database.Database, params: Record<string, unknown>) {
  const { slot_id } = params;
  if (!slot_id) throw { code: -32602, message: "teacher.attendance.get: требуется slot_id" };

  const slot = db.prepare("SELECT * FROM schedule_slots WHERE id=?").get(slot_id) as {
    id: string; discipline_title: string; starts_at: string; ends_at: string; group_name: string | null;
  } | undefined;
  if (!slot) throw { code: -32602, message: `teacher.attendance.get: слот не найден: ${slot_id}` };

  const marks = db.prepare(`
    SELECT am.*, p.full_name, p.short_name
    FROM attendance_marks am
    JOIN persons p ON p.id=am.student_id
    WHERE am.slot_id=?
    ORDER BY p.short_name
  `).all(slot_id) as Array<{
    student_id: string; present: number; score: number | null; note: string | null;
    full_name: string; short_name: string;
  }>;

  return {
    slot_id,
    discipline_title: slot.discipline_title,
    starts_at:        slot.starts_at,
    group_name:       slot.group_name,
    marks: marks.map(m => ({
      student_id:  m.student_id,
      short_name:  m.short_name,
      full_name:   m.full_name,
      present:     m.present === 1,
      score:       m.score,
      note:        m.note,
    })),
  };
}

export function teacherAttendanceSubmit(db: Database.Database, params: Record<string, unknown>) {
  const { slot_id, marks } = params;
  if (!slot_id) throw { code: -32602, message: "teacher.attendance.submit: требуется slot_id" };
  if (!Array.isArray(marks)) throw { code: -32602, message: "teacher.attendance.submit: требуется marks[]" };

  const upsert = db.prepare(`
    INSERT INTO attendance_marks (slot_id, student_id, present, score, note)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slot_id, student_id) DO UPDATE SET present=excluded.present, score=excluded.score, note=excluded.note
  `);

  const tx = db.transaction(() => {
    for (const m of marks as Array<{ student_id: string; present: boolean; score?: number; note?: string }>) {
      upsert.run(slot_id, m.student_id, m.present ? 1 : 0, m.score ?? null, m.note ?? null);
    }
  });
  tx();

  return { ok: true, saved: marks.length };
}

// ── Legacy методы (совместимость с glue/outbox) ───────────────────────────────

export function depositSvidetelstvo(_db: Database.Database, params: Record<string, unknown>) {
  // В реальной системе записывает свидетельство в Univerkon.
  // Mock: просто подтверждает получение.
  const p = params as { event_id?: string; student_id?: string; valence?: string; status?: string };
  return {
    deduplicated: false,
    event_id:  p.event_id,
    student_id: p.student_id,
    valence:   p.valence,
    status:    p.status,
  };
}
