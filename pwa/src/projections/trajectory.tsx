// Проекция траектории/дисциплин из Univerkon. stale-while-revalidate +
// метка свежести (§6.2): лежачая 1С → показываем устаревшее, помеченным.
// TODO(срез-1): fetch проекции через /api, кеш в IndexedDB, метка времени.
import type { StudentId } from "@eios/contracts";

export function Trajectory({ studentId }: { studentId: StudentId }) {
  return (
    <div>
      <h1>Мои дисциплины</h1>
      <p>studentId: {studentId}</p>
      {/* TODO(срез-1): список дидактических единиц; запуск SCORM-узла → ScormPlayer */}
    </div>
  );
}
