import type {
  TeacherScheduleResponse, TeacherScheduleDay, TeacherScheduleSlot,
  AttendanceResponse, AttendanceStudent,
} from "@eios/contracts";
import { SlotId } from "@eios/contracts";

// Педагог в демо — Петров Иван Сергеевич (он же ведёт занятия у студента)
export const TEACHER_ID = "teacher_petrov_1";

// Студенты группы ИВТ-22 (для посещаемости)
const STUDENTS_IVT22: AttendanceStudent[] = [
  { studentId: "s001", name: "Антонов Дмитрий Игоревич",    absent: false },
  { studentId: "s002", name: "Васильева Екатерина Олеговна", absent: false },
  { studentId: "s003", name: "Громов Артём Сергеевич",       absent: false },
  { studentId: "s004", name: "Дмитриева Ольга Павловна",     absent: false },
  { studentId: "s005", name: "Ежов Кирилл Витальевич",       absent: false },
  { studentId: "s006", name: "Захаров Никита Андреевич",     absent: false },
  { studentId: "s007", name: "Иванов Михаил Романович",      absent: false },
  { studentId: "s008", name: "Кириллова Виктория Юрьевна",   absent: false },
  { studentId: "s009", name: "Лебедев Фёдор Олегович",       absent: false },
  { studentId: "s010", name: "Макарова Дарья Ивановна",      absent: false },
  { studentId: "s011", name: "Николаев Игорь Павлович",      absent: false },
  { studentId: "s012", name: "Орлова Анастасия Витальевна",  absent: false },
  { studentId: "s013", name: "Павлов Степан Романович",      absent: false },
  { studentId: "s014", name: "Романова Полина Дмитриевна",   absent: false },
  { studentId: "s015", name: "Сергеев Алексей Константинович", absent: false },
  { studentId: "s016", name: "Тихонова Мария Андреевна",     absent: false },
  { studentId: "s017", name: "Ульянов Денис Сергеевич",      absent: false },
  { studentId: "s018", name: "Фёдорова Ксения Игоревна",     absent: false },
  { studentId: "s019", name: "Харитонов Владимир Юрьевич",   absent: false },
  { studentId: "s020", name: "Цветкова Юлия Дмитриевна",     absent: false },
  { studentId: "s021", name: "Чернов Максим Олегович",        absent: false },
  { studentId: "s022", name: "Шишкина Надежда Романовна",    absent: false },
  { studentId: "s023", name: "Щербаков Артур Витальевич",    absent: false },
];

const STUDENTS_IVT21: AttendanceStudent[] = [
  { studentId: "t001", name: "Алексеев Борис Сергеевич",    absent: false },
  { studentId: "t002", name: "Богданова Инна Олеговна",      absent: false },
  { studentId: "t003", name: "Волков Евгений Павлович",      absent: false },
  { studentId: "t004", name: "Герасимова Светлана Ивановна", absent: false },
  { studentId: "t005", name: "Данилов Сергей Анатольевич",   absent: false },
  { studentId: "t006", name: "Елисеев Пётр Дмитриевич",     absent: false },
  { studentId: "t007", name: "Жукова Алина Романовна",       absent: false },
  { studentId: "t008", name: "Зайцев Николай Андреевич",     absent: false },
  { studentId: "t009", name: "Иноземцева Вера Олеговна",     absent: false },
  { studentId: "t010", name: "Кузнецов Илья Максимович",     absent: false },
  { studentId: "t011", name: "Лазарева Юлия Сергеевна",      absent: false },
  { studentId: "t012", name: "Морозов Виктор Павлович",      absent: false },
  { studentId: "t013", name: "Нестерова Галина Ивановна",    absent: false },
  { studentId: "t014", name: "Овчинников Тимур Андреевич",   absent: false },
  { studentId: "t015", name: "Петрова Дарья Константиновна", absent: false },
  { studentId: "t016", name: "Рожков Антон Витальевич",      absent: false },
  { studentId: "t017", name: "Соловьёва Ирина Юрьевна",     absent: false },
  { studentId: "t018", name: "Тарасов Вадим Олегович",       absent: false },
  { studentId: "t019", name: "Устинова Кристина Ивановна",   absent: false },
  { studentId: "t020", name: "Фомин Александр Романович",    absent: false },
];

// Посещаемость по слотам (мок — в реальности GET /eios/teacher/.../attendance)
export const MOCK_ATTENDANCE: Record<string, AttendanceResponse> = {
  "tl1": { slotId: SlotId("tl1"), students: STUDENTS_IVT22.map(s => ({ ...s })) },
  "tl2": { slotId: SlotId("tl2"), students: STUDENTS_IVT22.map(s => ({ ...s })) },
  "tl3": { slotId: SlotId("tl3"), students: [...STUDENTS_IVT21.map(s => ({ ...s })), ...STUDENTS_IVT22.map(s => ({ ...s }))] },
  "tl4": { slotId: SlotId("tl4"), students: STUDENTS_IVT22.map(s => ({ ...s })) },
  "tl5": { slotId: SlotId("tl5"), students: STUDENTS_IVT22.map(s => ({ ...s })) },
};

// Расписание педагога — 2 недели, Jun 28 – Jul 11, 2026
const DAYS: TeacherScheduleDay[] = [
  { date: "2026-06-28", weekday: "Воскресенье", status: "weekend", slots: [] },
  { date: "2026-06-29", weekday: "Понедельник", status: "working", slots: [
    {
      slotId:    SlotId("tl1"),
      timeStart: "09:00", timeEnd: "10:30",
      room: "Ауд. 101",
      isOnline: false,
      unitRef:   { unitId: "u-db" as any, title: "Базы данных" },
      lessonKind: "Практика",
      groups: [{ groupId: "g22", title: "ИВТ-22", count: 23 }],
      status: "not_started",
      canRefuse: false, // сегодня
    },
    {
      slotId:    SlotId("tl2"),
      timeStart: "13:00", timeEnd: "14:30",
      room: "Ауд. 101",
      isOnline: false,
      unitRef:   { unitId: "u-db" as any, title: "Базы данных" },
      lessonKind: "Лекция",
      groups: [{ groupId: "g22", title: "ИВТ-22", count: 23 }],
      status: "not_started",
      canRefuse: false,
    },
  ]},
  { date: "2026-06-30", weekday: "Вторник",    status: "working", slots: [] },
  { date: "2026-07-01", weekday: "Среда",      status: "working", slots: [
    {
      slotId:    SlotId("tl3"),
      timeStart: "09:00", timeEnd: "10:30",
      room: "Ауд. 215",
      isOnline: false,
      unitRef:   { unitId: "u-db" as any, title: "Базы данных" },
      lessonKind: "Лекция",
      groups: [
        { groupId: "g21", title: "ИВТ-21", count: 20 },
        { groupId: "g22", title: "ИВТ-22", count: 23 },
      ],
      status: "not_started",
      canRefuse: true,
    },
  ]},
  { date: "2026-07-02", weekday: "Четверг",    status: "working", slots: [] },
  { date: "2026-07-03", weekday: "Пятница",    status: "working", slots: [
    {
      slotId:    SlotId("tl4"),
      timeStart: "11:00", timeEnd: "12:30",
      room: "Ауд. 101",
      isOnline: false,
      unitRef:   { unitId: "u-db" as any, title: "Базы данных" },
      lessonKind: "Практика",
      groups: [{ groupId: "g22", title: "ИВТ-22", count: 23 }],
      status: "not_started",
      canRefuse: true,
    },
  ]},
  { date: "2026-07-04", weekday: "Суббота",    status: "weekend", slots: [] },
  { date: "2026-07-05", weekday: "Воскресенье",status: "weekend", slots: [] },
  { date: "2026-07-06", weekday: "Понедельник",status: "working", slots: [
    {
      slotId:    SlotId("tl5"),
      timeStart: "09:00", timeEnd: "10:30",
      room: "Ауд. 101",
      isOnline: false,
      unitRef:   { unitId: "u-db" as any, title: "Базы данных" },
      lessonKind: "Практика",
      groups: [{ groupId: "g22", title: "ИВТ-22", count: 23 }],
      status: "not_started",
      canRefuse: true,
    },
  ]},
  { date: "2026-07-07", weekday: "Вторник",    status: "working", slots: [] },
  { date: "2026-07-08", weekday: "Среда",      status: "working", slots: [] },
  { date: "2026-07-09", weekday: "Четверг",    status: "working", slots: [] },
  { date: "2026-07-10", weekday: "Пятница",    status: "working", slots: [] },
  { date: "2026-07-11", weekday: "Суббота",    status: "weekend", slots: [] },
];

export const MOCK_TEACHER_SCHEDULE: TeacherScheduleResponse = {
  teacherId: TEACHER_ID,
  from: "2026-06-28",
  to:   "2026-07-11",
  days: DAYS,
};
