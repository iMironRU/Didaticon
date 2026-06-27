import { Shell } from "./Shell.js";
import { LocaleProvider } from "./locale.js";
import {
  MOCK_PERSON, MOCK_PERSON_PARENT, LEARNER_VO, LEARNER_SPO,
  MOCK_SCHEDULE_VO,
  MOCK_GRADEBOOK_VO, MOCK_GRADEBOOK_SPO,
  MOCK_NOTIFICATIONS,
} from "./mocks/index.js";

export type DemoPersona = "student" | "parent";

interface Props {
  lkUrl?:    string;
  onLogout?: () => void;
  persona?:  DemoPersona;
}

// DemoShell — Shell с моковыми данными для демо-режима и разработки
export function DemoShell({ lkUrl, onLogout, persona = "student" }: Props) {
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
