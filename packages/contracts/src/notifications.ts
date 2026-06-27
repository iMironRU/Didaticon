// Контракт уведомлений: GET/POST /notifications
import type { NotificationId, LearnerId } from "./ids.js";

// ---------------------------------------------------------------------------
// Категории уведомлений
// ---------------------------------------------------------------------------

export type NotificationCategory =
  | "lesson_available"    // открылось занятие
  | "grade_posted"        // выставлена оценка
  | "retake_scheduled"    // назначена пересдача
  | "booking_confirmed"   // запись на отработку / пересдачу принята
  | "debt_deadline"       // долг приближается к дедлайну
  | "announcement"        // объявление от кафедры / деканата
  | "system";             // технические уведомления

// ---------------------------------------------------------------------------
// Структура уведомления
// ---------------------------------------------------------------------------

export interface Notification {
  notificationId: NotificationId;
  category:       NotificationCategory;
  title:          string;
  body:           string;           // краткое содержание (в списке)
  fullText?:      string;           // полный текст → детальный экран
  links?:         NotificationLink[]; // внешние ссылки (target="_blank")
  deepLink?:      string;           // внутренняя навигация: "#/gradebook"
  createdAt:      string;           // ISO-8601
  read:           boolean;
  learnerId?:     LearnerId;        // для родителя: о каком ребёнке
}

export interface NotificationLink {
  label: string;
  url:   string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount:   number;
}

/** Univerkon → glue webhook (POST /notifications) */
export interface NotificationPushPayload {
  studentId:  string;             // learnerId получателя
  category:   NotificationCategory;
  title:      string;
  body:       string;
  fullText?:  string;
  links?:     NotificationLink[];
  deepLink?:  string;
  learnerId?: string;             // для родителя
}

export interface ReadAllResponse {
  ok:    boolean;
  count: number;
}
