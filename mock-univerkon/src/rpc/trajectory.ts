/** Обратная совместимость с legacy smoke-тестом и glue/outbox. */
export function trajectoryGet(_params: Record<string, unknown>) {
  const studentId = (_params as { student_id?: string }).student_id ?? "unknown";
  return {
    student_id:       studentId,
    discipline_title: "Тестовая дисциплина",
    nodes: [
      {
        unit_id:       "unit-1",
        event_id:      "event-smoke-1",
        title:         "Вводный SCORM-модуль",
        closure:       "completion",
        scorm_version: "1.2",
        package_url:   "/scorm/test/index.html",
        state:         "open",
      },
    ],
    projected_at: new Date().toISOString(),
  };
}
