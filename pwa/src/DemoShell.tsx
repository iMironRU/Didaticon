import { Shell } from "./Shell.js";
import {
  MOCK_PERSON, LEARNER_VO, LEARNER_SPO,
  MOCK_SCHEDULE_VO,
  MOCK_GRADEBOOK_VO, MOCK_GRADEBOOK_SPO,
  MOCK_NOTIFICATIONS,
} from "./mocks/index.js";

interface Props {
  lkUrl?:    string;
  onLogout?: () => void;
}

// DemoShell — Shell с моковыми данными для демо-режима и разработки
export function DemoShell({ lkUrl, onLogout }: Props) {
  const scheduleMap = new Map([
    [LEARNER_VO.learnerId,  MOCK_SCHEDULE_VO],
    // для СПО расписание пока не отдельное — ВО-расписание как заглушка
    [LEARNER_SPO.learnerId, MOCK_SCHEDULE_VO],
  ]);

  const gradebookMap = new Map([
    [LEARNER_VO.learnerId,  MOCK_GRADEBOOK_VO],
    [LEARNER_SPO.learnerId, MOCK_GRADEBOOK_SPO],
  ]);

  return (
    <Shell
      person={MOCK_PERSON}
      scheduleMap={scheduleMap}
      gradebookMap={gradebookMap}
      notifications={MOCK_NOTIFICATIONS}
      lkUrl={lkUrl}
      onLogout={onLogout}
    />
  );
}
