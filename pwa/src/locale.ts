import { createContext, useContext, useEffect, useState, createElement } from "react";
import type { ReactNode } from "react";

export const LOCALES = ["ru", "en", "kk"] as const;
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
    langKk:            "Қазақша",
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
    retakeScheduled:   "пересдача назначена",
    commission:        "(комиссия)",
    failed:            "не сдано",
    // Колонки таблицы зачётной книжки (sr-only)
    controlType:       "Тип контроля",
    discipline:        "Дисциплина",
    grade:             "Оценка",
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
    langKk:            "Қазақша",
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
    retakeScheduled:   "retake scheduled",
    commission:        "(commission)",
    failed:            "failed",
    // Gradebook table columns (sr-only)
    controlType:       "Control type",
    discipline:        "Discipline",
    grade:             "Grade",
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
  kk: {
    // Навигация
    schedule:          "Кесте",
    disciplines:       "Пәндер",
    gradebook:         "Оқу кітапшасы",
    profile:           "Профиль",
    // Экрандар / тақырыптар
    notifications:     "Хабарландырулар",
    allLessons:        "Барлық сабақтар",
    learnerProfile:    "Оқушының профилі",
    results:           "Оқу нәтижелері",
    // Батырмалар
    back:              "Артқа",
    logout:            "Шығу",
    readAll:           "Барлығын оқыдым",
    setAsDefault:      "Негізгі ету",
    openLesson:        "►  Сабақты ашу",
    openLessonAgain:   "↺  Қайта ашу",
    // Кесте
    today:             "Бүгін",
    day:               "Күн",
    week:              "Апта",
    noLessons:         "Сабақ жоқ",
    notAvailable:      "Әлі қол жетімді емес",
    passed:            "өтті",
    // Пәндер / оқу кітапшасы
    course:            "Курс",
    semester:          "Семестр",
    inProgress:        "Үдерісте",
    credits:           "сағ.",
    // Сабақ түрлері
    lec:               "Дәр",
    prac:              "Пр",
    lab:               "Зерт",
    // Хабарландырулар
    noNotifications:   "Хабарландыру жоқ",
    systemSource:      "Жүйе",
    // Контекст ауыстырғыш / профильдер
    active:            "Белсенді",
    completedSection:  "Аяқталды",
    completedYear:     "Аяқталды",
    defaultBadge:      "Әдепкі",
    disciplinesGrades: "Пәндер мен бағалар",
    profiles:          "Профильдер",
    learnersTitle:     "Оқу профильдері",
    // Профиль / жеке деректер
    personalInfo:      "Жеке деректер",
    lastName:          "Тегі",
    firstName:         "Аты",
    patronymic:        "Әкесінің аты",
    eivFull:           "Университеттің бірыңғай идентификаторы (БЖИ)",
    goToLk:            "Жеке кабинетке өту ↗",
    learnProfile:      "Оқу профилі",
    switchProfile:     "Профильді ауыстыру",
    langRu:            "Русский",
    langEn:            "English",
    langKk:            "Қазақша",
    // Профиль / баптаулар
    language:          "Тіл",
    theme:             "Тақырып",
    themeAuto:         "Авто",
    themeLight:        "Ашық",
    themeDark:         "Қара",
    eivLabel:          "БЖИ",
    // Басқа
    update:            "↑ Жаңарту",
    copied:            "Көшірілді",
    dataUnavailable:   "Деректер қол жетімді емес",
    lessonsCount:      "сабақ",
    updateApp:         "Қосымшаны жаңарту",
    copyForSupport:    "Қолдауға көшіру",
    // Сабақ экраны
    teacherSection:    "Оқытушы",
    attendanceSection: "Қатысу",
    tasksSection:      "Тапсырмалар",
    controlSection:    "Бақылау",
    ratingSection:     "Сабақты бағалау",
    submitRating:      "Баға жіберу",
    ratingDone:        "✓ Бағаңыз үшін рахмет!",
    campusOnly:        "🏫 Тек кампус желісінен",
    attPending:        "Күтілуде",
    present:           "Қатысты",
    absentExcused:     "Дәлелді себеппен болмады",
    absent:            "Болмады",
    onReview:          "Тексерілуде",
    notDone:           "Орындалмаған",
    doTask:            "Орындау →",
    eventLesson:       "Сабақ",
    eventModule:       "Модуль",
    eventAttestation:  "Аттестация",
    awaitingResult:    "— күтілуде",
    // Тәжірибе / пәндер
    practiceDays:      "тәжірибе күні",
    practiceAllDays:   "Тәжірибе күндері",
    planned:           "жоспарланған",
    pointsUnit:        "б.",
    // Қорытынды бақылау / оқу кітапшасы
    finalControl:      "Қорытынды бақылау",
    noLessonsUnit:     "Сабақ жоқ",
    currentSemester:   "Ағымдағы",
    spring:            "Көктем",
    autumn:            "Күз",
    debt:              "Қарыз",
    creditsUnit:       "кр.",
    noSlots:           "Бос орын жоқ",
    spots:             "орын",
    book:              "Жазылу",
    retakeNum:         "Қайта тапсыру №",
    retakeScheduled:   "қайта тапсыру жоспарланған",
    commission:        "(комиссия)",
    failed:            "тапсырылмаған",
    // Бағалар кітабы кестесінің бағаналары (sr-only)
    controlType:       "Бақылау түрі",
    discipline:        "Пән",
    grade:             "Баға",
    // Ата-ана режимі
    myChildren:        "Менің балаларым",
    demoAsStudent:     "Студент",
    demoAsParent:      "Ата-ана",
    viewingChild:      "Профильді қарау:",
    // Хабарландыру санаттары
    notifLesson:       "Сабақ",
    notifGrade:        "Баға",
    notifRetake:       "Қайта тапсыру",
    notifBooking:      "Жазылу",
    notifDebt:         "Қарыз",
    notifAnnouncement: "Хабарландыру",
    notifSystem:       "Жүйе",
    deepLink:          "Өту →",
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
  const lang = navigator.language;
  if (lang.startsWith("kk") || lang.startsWith("kz")) return "kk";
  return lang.startsWith("ru") ? "ru" : "en";
}

const LocaleContext = createContext<LocaleCtx>({
  locale:       "ru",
  t:            key => STRINGS.ru[key],
  changeLocale: () => {},
});

/** Маппинг наших локалей в BCP 47 теги для `<html lang>`.
 *  kk → "kk-Cyrl" (казахская кириллица) — у нас именно она. */
const LANG_TAG: Record<Locale, string> = { ru: "ru", en: "en", kk: "kk-Cyrl" };

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  // Реактивная смена <html lang> — скринридер озвучивает текст голосом
  // выбранной локали, поисковики и iOS Voice Control видят корректный язык.
  // (a11y политика §5.2, didakticon-accessibility.md)
  useEffect(() => {
    document.documentElement.lang = LANG_TAG[locale];
  }, [locale]);

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
