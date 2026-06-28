import { Shell } from "./Shell.js";
import { TeacherShell } from "./TeacherShell.js";
import { LocaleProvider } from "./locale.js";
import {
  MOCK_PERSON, MOCK_PERSON_PARENT, LEARNER_VO, LEARNER_SPO,
  MOCK_SCHEDULE_VO,
  MOCK_GRADEBOOK_VO, MOCK_GRADEBOOK_SPO,
  MOCK_NOTIFICATIONS,
  MOCK_TEACHER_SCHEDULE, MOCK_ATTENDANCE,
} from "./mocks/index.js";

export type DemoPersona = "student" | "parent" | "teacher";

interface Props {
  lkUrl?:    string;
  onLogout?: () => void;
  persona?:  DemoPersona;
}

// DemoShell — Shell с моковыми данными для демо-режима и разработки
export function DemoShell({ lkUrl, onLogout, persona = "student" }: Props) {
  if (persona === "teacher") {
    return (
      <TeacherShell
        teacherName="Петров Иван Сергеевич"
        schedule={MOCK_TEACHER_SCHEDULE}
        attendance={MOCK_ATTENDANCE}
        eiv="260001"
        lkUrl={lkUrl}
        onLogout={onLogout}
      />
    );
  }

  const scheduleMap = new Map([
    [LEARNER_VO.learnerId,  MOCK_SCHEDULE_VO],
    [LEARNER_SPO.learnerId, MOCK_SCHEDULE_VO],
  ]);

  const gradebookMap = new Map([
    [LEARNER_VO.learnerId,  MOCK_GRADEBOOK_VO],
    [LEARNER_SPO.learnerId, MOCK_GRADEBOOK_SPO],
  ]);

  const person = persona === "parent" ? MOCK_PERSON_PARENT : MOCK_PERSON;

  return (
    <LocaleProvider>
      <Shell
        person={person}
        scheduleMap={scheduleMap}
        gradebookMap={gradebookMap}
        notifications={MOCK_NOTIFICATIONS}
        lkUrl={lkUrl}
        onLogout={onLogout}
      />
    </LocaleProvider>
  );
}
