import type Database from "better-sqlite3";

export function gradebookGet(db: Database.Database, params: Record<string, unknown>) {
  const { student_id } = params;
  if (!student_id) throw { code: -32602, message: "gradebook.get: требуется student_id" };

  const rows = db.prepare(`
    SELECT * FROM gradebook_entries WHERE student_id=? ORDER BY discipline_title
  `).all(student_id) as Array<{
    id: string; discipline_id: string; discipline_title: string;
    credits: number; grade: string | null; grade_label: string | null;
    graded_date: string | null; form_kind: string;
  }>;

  return {
    student_id,
    entries: rows.map(r => ({
      discipline_id:    r.discipline_id,
      discipline_title: r.discipline_title,
      credits:          r.credits,
      form_kind:        r.form_kind,
      grade:            r.grade,
      grade_label:      r.grade_label,
      graded_date:      r.graded_date,
    })),
  };
}
