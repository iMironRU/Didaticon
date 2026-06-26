import { useState } from "react";

export const LOCALES = ["ru", "en"] as const;
export type Locale = typeof LOCALES[number];

export const STRINGS = {
  ru: {
    // Навигация
    schedule:          "Расписание",
    disciplines:       "Дисциплины",
    gradebook:         "Зачётка",
    profile:           "Профиль",
    // Экраны / заголовки
    notifications:     "Уведомления",
    allLessons:        "Все занятия",
    learnerProfile:    "Профиль обучающегося",
    results:           "Итоги обучения",
    // Кнопки
    back:              "Назад",
    logout:            "Выйти",
    readAll:           "Прочитать все",
    setAsDefault:      "Сделать основным",
    openLesson:        "Открыть занятие",
    // Расписание
    today:             "Сегодня",
    day:               "День",
    week:              "Неделя",
    noLessons:         "Занятий нет",
    notAvailable:      "Ещё не доступно",
    passed:            "пройдено",
    // Дисциплины / зачётка
    course:            "Курс",
    semester:          "Семестр",
    inProgress:        "В процессе",
    credits:           "ч.",
    // Типы занятий
    lec:               "Лек",
    prac:              "Пр",
    lab:               "Лаб",
    // Уведомления
    noNotifications:   "Нет уведомлений",
    systemSource:      "Система",
    // Переключатель контекста
    active:            "Активные",
    completedSection:  "Завершено",
    completedYear:     "Завершено",
    defaultBadge:      "По умолчанию",
    disciplinesGrades: "Дисциплины и оценки",
    profiles:          "Профили",
    // Профиль / личные данные
    personalInfo:      "Личные данные",
    lastName:          "Фамилия",
    firstName:         "Имя",
    patronymic:        "Отчество",
    eivFull:           "Единый идентификатор ВУЗа",
    goToLk:            "Перейти в личный кабинет",
    // Профиль / настройки
    language:          "Язык",
    theme:             "Тема",
    themeAuto:         "Авто",
    themeLight:        "Светлая",
    themeDark:         "Тёмная",
    eivLabel:          "ЕИВ",
    // Прочее
    update:            "↑ Обновить",
    copied:            "Скопировано",
    dataUnavailable:   "Данные недоступны",
    lessonsCount:      "занятий",
  },
  en: {
    // Nav
    schedule:          "Schedule",
    disciplines:       "Courses",
    gradebook:         "Grades",
    profile:           "Profile",
    // Screens
    notifications:     "Notifications",
    allLessons:        "All lessons",
    learnerProfile:    "Learner profile",
    results:           "Study results",
    // Actions
    back:              "Back",
    logout:            "Log out",
    readAll:           "Mark all read",
    setAsDefault:      "Set as default",
    openLesson:        "Open lesson",
    // Schedule
    today:             "Today",
    day:               "Day",
    week:              "Week",
    noLessons:         "No lessons",
    notAvailable:      "Not yet available",
    passed:            "completed",
    // Disciplines / gradebook
    course:            "Year",
    semester:          "Semester",
    inProgress:        "In progress",
    credits:           "h.",
    // Lesson types
    lec:               "Lec",
    prac:              "Pr",
    lab:               "Lab",
    // Notifications
    noNotifications:   "No notifications",
    systemSource:      "System",
    // Context switcher
    active:            "Active",
    completedSection:  "Completed",
    completedYear:     "Completed",
    defaultBadge:      "Default",
    disciplinesGrades: "Courses & grades",
    profiles:          "Profiles",
    // Profile / personal info
    personalInfo:      "Personal info",
    lastName:          "Last name",
    firstName:         "First name",
    patronymic:        "Patronymic",
    eivFull:           "University unique ID",
    goToLk:            "Go to personal account",
    // Profile screen
    language:          "Language",
    theme:             "Theme",
    themeAuto:         "Auto",
    themeLight:        "Light",
    themeDark:         "Dark",
    eivLabel:          "UID",
    // Misc
    update:            "↑ Update",
    copied:            "Copied",
    dataUnavailable:   "Data unavailable",
    lessonsCount:      "lessons",
  },
} as const;

export type StringKey = keyof typeof STRINGS.ru;

const LOCALE_KEY = "eios_locale";

function detectLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
  if (saved && LOCALES.includes(saved)) return saved;
  return navigator.language.startsWith("ru") ? "ru" : "en";
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  function changeLocale(l: Locale) {
    localStorage.setItem(LOCALE_KEY, l);
    setLocale(l);
  }

  function t(key: StringKey): string {
    return STRINGS[locale][key];
  }

  return { locale, changeLocale, t };
}
