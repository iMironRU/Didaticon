import type Database from "better-sqlite3";
import { personGet } from "./person.js";
import { scheduleGet } from "./schedule.js";
import { gradebookGet } from "./gradebook.js";
import { notificationsGet, notificationsMarkRead } from "./notifications.js";
import { teacherScheduleGet, teacherAttendanceGet, teacherAttendanceSubmit, depositSvidetelstvo } from "./teacher.js";
import { trajectoryGet } from "./trajectory.js";

type Handler = (db: Database.Database, params: Record<string, unknown>) => unknown;

export const RPC_METHODS: Record<string, Handler> = {
  // Профиль
  "person.get":                   (db, p) => personGet(db, p),
  // Студент
  "schedule.get":                 (db, p) => scheduleGet(db, p),
  "gradebook.get":                (db, p) => gradebookGet(db, p),
  "notifications.get":            (db, p) => notificationsGet(db, p),
  "notifications.markRead":       (db, p) => notificationsMarkRead(db, p),
  // Педагог
  "teacher.schedule.get":         (db, p) => teacherScheduleGet(db, p),
  "teacher.attendance.get":       (db, p) => teacherAttendanceGet(db, p),
  "teacher.attendance.submit":    (db, p) => teacherAttendanceSubmit(db, p),
  // Legacy (smoke-тест + outbox совместимость)
  "trajectory.get":               (_db, p) => trajectoryGet(p),
  "deposit_svidetelstvo":         (db, p) => depositSvidetelstvo(db, p),
};
