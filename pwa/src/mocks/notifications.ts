import type { NotificationsResponse, Notification } from "@eios/contracts";
import { NotificationId } from "@eios/contracts";

const n = (id: string, partial: Omit<Notification, "notificationId">): Notification => ({
  notificationId: NotificationId(id),
  ...partial,
});

const NOTIFICATIONS: Notification[] = [
  n("n1", {
    category: "lesson_available",
    read: false,
    createdAt: "2026-06-27T08:00:00Z",
    title: "Новое занятие доступно",
    body: "Открылось занятие «Транзакции и блокировки» — Базы данных",
    fullText: "Вам открыт доступ к занятию «Транзакции и блокировки» в рамках дисциплины «Базы данных».\n\nЗанятие содержит теоретический материал и практическое задание. Срок выполнения — до 5 июля 2026 г. По итогам занятия будет выставлена оценка в ведомости.",
    deepLink: "#/lesson/l6",
    links: [
      { label: "Перейти к занятию",  url: "#/lesson/l6"     },
      { label: "Учебный план",        url: "#/performance"   },
    ],
  }),
  n("n2", {
    category: "grade_posted",
    read: false,
    createdAt: "2026-06-26T14:10:00Z",
    title: "Оценка выставлена",
    body: "Математический анализ — «Производные»: выставлена оценка",
    fullText: "По результатам проверки работы по теме «Производные и их применение» выставлена оценка: 4 (хорошо).\n\nНабрано баллов: 55 из 100. Работа зачтена.",
    deepLink: "#/performance/unit_math",
    links: [{ label: "Посмотреть оценку", url: "#/performance/unit_math" }],
  }),
  n("n3", {
    category: "debt_deadline",
    read: false,
    createdAt: "2026-06-26T09:00:00Z",
    title: "Срок долга приближается",
    body: "Домашнее задание по «Базам данных» — срок сдачи 10 июля",
    fullText: "У вас есть незакрытое домашнее задание по дисциплине «Базы данных» (занятие «Индексы и оптимизация запросов»). Срок сдачи: 10 июля 2026 г.",
    deepLink: "#/performance/unit_db",
  }),
  n("n4", {
    category: "retake_scheduled",
    read: false,
    createdAt: "2026-06-25T16:30:00Z",
    title: "Пересдача назначена",
    body: "Сети передачи данных — пересдача 15 июля 2026",
    fullText: "По дисциплине «Сети передачи данных» назначена пересдача (попытка 2 из 2).\n\nДата: 15 июля 2026 г. Запишитесь на удобный слот в зачётной книжке.",
    deepLink: "#/gradebook",
    links: [{ label: "Перейти к зачётке", url: "#/gradebook" }],
  }),
  n("n5", {
    category: "booking_confirmed",
    read: true,
    createdAt: "2026-06-24T11:20:00Z",
    title: "Запись подтверждена",
    body: "Вы записаны на отработку занятия по «Базам данных» — 26 июня в 13:00",
    deepLink: "#/schedule",
  }),
  n("n6", {
    category: "announcement",
    read: true,
    createdAt: "2026-06-24T10:00:00Z",
    title: "Объявление кафедры",
    body: "Кафедра ПИ: консультация перед экзаменом по БД — 10 января 2027, ауд. 101",
    fullText: "Кафедра прикладной информатики информирует: предэкзаменационная консультация по дисциплине «Базы данных» состоится 10 января 2027 г. в аудитории 101 с 14:00 до 16:00.\n\nПреподаватель: Петров И.С.",
    links: [{ label: "Расписание кафедры", url: "https://example.edu/dept/pi" }],
  }),
  n("n7", {
    category: "system",
    read: true,
    createdAt: "2026-06-25T23:00:00Z",
    title: "Плановые работы",
    body: "26 июня 23:00–01:00 — технические работы, ЭИОС будет недоступна",
  }),
  n("n8", {
    category: "system",
    read: true,
    createdAt: "2026-06-22T09:00:00Z",
    title: "Обновление системы",
    body: "ЭИОС обновлена до версии 0.3.0 — новое расписание и уведомления",
    fullText: "В версии 0.3.0:\n• Новый экран расписания с видом на неделю\n• Категории уведомлений\n• Тёмная тема по умолчанию из настроек ОС\n• Исправлено отображение БРС в зачётке",
  }),
];

export const MOCK_NOTIFICATIONS: NotificationsResponse = {
  notifications: NOTIFICATIONS,
  unreadCount: NOTIFICATIONS.filter(n => !n.read).length,
};
