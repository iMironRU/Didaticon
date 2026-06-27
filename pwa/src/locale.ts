import { createContext, useContext, useState, createElement } from "react";
import type { ReactNode } from "react";

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
    logout:            "Выйти из аккаунта",
    readAll:           "Прочитать все",
    setAsDefault:      "Сделать основным",
    openLesson:        "►  Открыть занятие",
    openLessonAgain:   "↺  Открыть занятие снова",
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
    // Переключатель контекста / профили
    active:            "Активные",
    completedSection:  "Завершено",
    completedYear:     "Завершено",
    defaultBadge:      "По умолчанию",
    disciplinesGrades: "Дисциплины и оценки",
    profiles:          "Профили",
    learnersTitle:     "Профили обучения",
    // Профиль / личные данные
    personalInfo:      "Личные данные",
    lastName:          "Фамилия",
    firstName:         "Имя",
    patronymic:        "Отчество",
    eivFull:           "Единый идентификатор вуза (ЕИВ)",
    goToLk:            "Перейти в личный кабинет ↗",
    learnProfile:      "Профиль обучения",
    switchProfile:     "Сменить профиль",
    langRu:            "Русский",
    langEn:            "English",
    // Профиль / настройки
    language:          "Язык",
    theme:             "Тема оформления",
    themeAuto:         "Авто",
    themeLight:        "Светлая",
    themeDark:         "Тёмная",
    eivLabel:          "ЕИВ",
    // Прочее
    update:            "↑ Обновить",
    copied:            "Скопировано",
    dataUnavailable:   "Данные недоступны",
    lessonsCount:      "занятий",
    updateApp:         "Обновить приложение",
    copyForSupport:    "Скопировать для поддержки",
    // Занятие (LessonScreen)
    teacherSection:    "Педагог",
    attendanceSection: "Посещаемость",
    tasksSection:      "Задания",
    controlSection:    "Контроль",
    ratingSection:     "Оценить занятие",
    submitRating:      "Отправить оценку",
    ratingDone:        "✓ Спасибо за оценку!",
    campusOnly:        "🏫 Только из сети вуза",
    attPending:        "Ожидается",
    present:           "Присутствовал",
    absentExcused:     "Отсутствовал (уважит.)",
    absent:            "Отсутствовал",
    onReview:          "На проверке",
    notDone:           "Не выполнено",
    doTask:            "Выполнить →",
    eventLesson:       "Занятие",
    eventModule:       "Модуль",
    eventAttestation:  "Аттестация",
    awaitingResult:    "— ожидается",
    // Практика / дисциплины
    practiceDays:      "дней практики",
    practiceAllDays:   "Дни практики",
    planned:           "планируется",
    pointsUnit:        "б.",
    // Итоговый контроль / зачётная книжка
    finalControl:      "Итоговый контроль",
    noLessonsUnit:     "Нет занятий",
    currentSemester:   "Текущий",
    spring:            "Весна",
    autumn:            "Осень",
    debt:              "Долг",
    creditsUnit:       "з.е.",
    noSlots:           "Нет доступных слотов",
    spots:             "мест",
    book:              "Записаться",
    retakeNum:         "Пересдача №",
    commission:        "(комиссия)",
    // Родительский режим
    myChildren:        "Мои дети",
    demoAsStudent:     "Студент",
    demoAsParent:      "Родитель",
    viewingChild:      "Просмотр профиля:",
    // Категории уведомлений
    notifLesson:       "Занятие",
    notifGrade:        "Оценка",
    notifRetake:       "Пересдача",
    notifBooking:      "Запись",
    notifDebt:         "Долг",
    notifAnnouncement: "Объявление",
    notifSystem:       "Система",
    deepLink:          "Перейти →",
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
    openLesson:        "►  Open lesson",
    openLessonAgain:   "↺  Open again",
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
    // Context switcher / profiles
    active:            "Active",
    completedSection:  "Completed",
    completedYear:     "Completed",
    defaultBadge:      "Default",
    disciplinesGrades: "Courses & grades",
    profiles:          "Profiles",
    learnersTitle:     "Study profiles",
    // Profile / personal info
    personalInfo:      "Personal info",
    lastName:          "Last name",
    firstName:         "First name",
    patronymic:        "Patronymic",
    eivFull:           "University unique ID (UID)",
    goToLk:            "Go to personal account ↗",
    learnProfile:      "Study profile",
    switchProfile:     "Switch profile",
    langRu:            "Русский",
    langEn:            "English",
    // Profile screen
    language:          "Language",
    theme:             "Appearance",
    themeAuto:         "Auto",
    themeLight:        "Light",
    themeDark:         "Dark",
    eivLabel:          "UID",
    // Misc
    update:            "↑ Update",
    copied:            "Copied",
    dataUnavailable:   "Data unavailable",
    lessonsCount:      "lessons",
    updateApp:         "Update app",
    copyForSupport:    "Copy for support",
    // Lesson screen
    teacherSection:    "Teacher",
    attendanceSection: "Attendance",
    tasksSection:      "Tasks",
    controlSection:    "Control",
    ratingSection:     "Rate lesson",
    submitRating:      "Submit rating",
    ratingDone:        "✓ Thanks for rating!",
    campusOnly:        "🏫 Campus network only",
    attPending:        "Pending",
    present:           "Present",
    absentExcused:     "Excused absence",
    absent:            "Absent",
    onReview:          "Under review",
    notDone:           "Not done",
    doTask:            "Do task →",
    eventLesson:       "Lesson",
    eventModule:       "Module",
    eventAttestation:  "Assessment",
    awaitingResult:    "— pending",
    // Practice / disciplines
    practiceDays:      "practice days",
    practiceAllDays:   "Practice days",
    planned:           "tentative",
    pointsUnit:        "pts",
    // Final control / gradebook
    finalControl:      "Final assessment",
    noLessonsUnit:     "No lessons",
    currentSemester:   "Current",
    spring:            "Spring",
    autumn:            "Autumn",
    debt:              "Debt",
    creditsUnit:       "cr.",
    noSlots:           "No available slots",
    spots:             "spots",
    book:              "Book",
    retakeNum:         "Retake #",
    commission:        "(commission)",
    // Parent mode
    myChildren:        "My children",
    demoAsStudent:     "Student",
    demoAsParent:      "Parent",
    viewingChild:      "Viewing profile:",
    // Notification categories
    notifLesson:       "Lesson",
    notifGrade:        "Grade",
    notifRetake:       "Retake",
    notifBooking:      "Booking",
    notifDebt:         "Debt",
    notifAnnouncement: "Announcement",
    notifSystem:       "System",
    deepLink:          "Open →",
  },
} as const;

export type StringKey = keyof typeof STRINGS.ru;

// ── React Context ──────────────────────────────────────────────────────────────

interface LocaleCtx {
  locale:       Locale;
  t:            (key: StringKey) => string;
  changeLocale: (l: Locale) => void;
}

const LOCALE_KEY = "eios_locale";

function detectLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
  if (saved && LOCALES.includes(saved)) return saved;
  return navigator.language.startsWith("ru") ? "ru" : "en";
}

const LocaleContext = createContext<LocaleCtx>({
  locale:       "ru",
  t:            key => STRINGS.ru[key],
  changeLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  function changeLocale(l: Locale) {
    localStorage.setItem(LOCALE_KEY, l);
    setLocale(l);
  }

  function t(key: StringKey): string {
    return STRINGS[locale][key];
  }

  return createElement(LocaleContext.Provider, { value: { locale, t, changeLocale } }, children);
}

export function useLocale(): LocaleCtx {
  return useContext(LocaleContext);
}
