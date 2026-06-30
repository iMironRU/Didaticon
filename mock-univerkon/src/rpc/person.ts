import type Database from "better-sqlite3";

export function personGet(db: Database.Database, params: Record<string, unknown>) {
  const { student_id, teacher_id, parent_id } = params;
  const id = (student_id ?? teacher_id ?? parent_id) as string | undefined;
  if (!id) throw { code: -32602, message: "person.get: требуется student_id, teacher_id или parent_id" };

  const row = db.prepare("SELECT * FROM persons WHERE id=?").get(id) as {
    id: string; type: string; full_name: string; short_name: string;
    birth_date: string | null; group_name: string | null; course: number | null;
    teacher_title: string | null;
  } | undefined;

  if (!row) throw { code: -32602, message: `person.get: персона не найдена: ${id}` };

  return {
    id:           row.id,
    type:         row.type,
    full_name:    row.full_name,
    short_name:   row.short_name,
    birth_date:   row.birth_date,
    group_name:   row.group_name,
    course:       row.course,
    teacher_title: row.teacher_title,
  };
}
