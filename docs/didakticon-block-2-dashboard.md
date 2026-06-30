# Дидактикон — блок II: Дашборд

**Статус:** утверждено к реализации
**Версия:** 1.2
**Дата:** 30 июня 2026
**Контекст:** экосистема Univerkon, edu-framework
**Принадлежность:** iMironRU, CC BY-SA 4.0

---

## Как читать этот документ

Документ описывает второй блок Дидактикона — главный экран. Дашборд —
единая поверхность для всех ролей, конфигурируется по выбранному
контексту: студент видит свой состав карточек, преподаватель — свой,
старший проверяющий — свой, куратор — свой, родитель — сигнальный по
аналогии с куратором.

В версии 1.2 actions всех педагогических kind определены, kind
`explanation_required` упразднён (объяснительная — кадровый документ,
не учебный, живёт в ЛК сотрудника), родительская конфигурация
перерисована из «read-only проекции студенческой» в **сигнальную по
аналогии с куратором**. Добавлен kind `active_attempt` для extended-форм,
переживающих событие.

Документ — спецификация, не рабочая гипотеза. Архитектурные решения
зафиксированы.

---

## 1. Назначение блока

Блок II решает три задачи:

1. Дать пользователю главный экран — лента приоритетных карточек,
   требующих его действия в текущем контексте.
2. Свести в одну ленту факты из нескольких источников (Универкон,
   Тестикон, межсистемная шина).
3. Не подменять собой управленческие функции (полные списки, разделы,
   архивы — отдельно, не дашборд).

---

## 2. Несущие принципы

1. **Одна поверхность, конфигурация по контексту.**
2. **Дашборд = «что от меня хотят».** Только actionable-карточки.
3. **5 карточек на экран.** Остальное — в отдельный раздел с фильтрами.
4. **Одно дело — одна карточка.**
5. **Не смешиваем контексты.** Каждый контекст — самостоятельный дашборд.
6. **Дидактикон-backend собирает дашборд.**
7. **Polling по жесту пользователя.** Push не используется.
8. **Кеш 60 секунд.**
9. **Дидактикон только про учебный процесс.** Кадровые,
   финансовые, документооборотные акты — в специализированных
   приложениях ОО; в Дидактиконе только notification через `external_action`.
10. **Разделение ролей.** Деятельные (меняют учебные факты) —
    `student`, `teacher.instructor`, `teacher.senior_grader`,
    `examiner`, `applicant`. Наблюдательные (только видят,
    реагируют вне Дидактикона) — `teacher.curator`, `parent`.

---

## 3. Терминология

**Карточка дашборда** — единица отображения. Гибридная структура:
общая шапка + типизированный `details` по `kind`.

**Kind карточки** — тип содержательного объекта. В разных
конфигурациях дашборда — разный набор kind.

**Конфигурация дашборда** — набор kind, доступных в выбранном (роль,
контекст). Конфигураций пять: student, teacher.instructor,
teacher.senior_grader, teacher.curator, parent.

**Actionable** — карточка, действие по которой выполняет владелец
дашборда.

**Сигнальная карточка** — карточка, появляющаяся **только при
отклонении** (alert от Универкона). Штатно отсутствует. Используется
в наблюдательных ролях (curator, parent).

**Source класс карточки** — откуда карточка поступила в Дидактикон.
Три класса (§4).

**Urgency** — числовая мера срочности для сортировки и среза top-5.

**Recovery options** — для долговых карточек: доступные пути закрытия
(online через пакет / offline через запись на отработку).

---

## 4. Три источника карточек

### 4.1. Локальные

Источник — сам Дидактикон. «Штатные» карточки рабочего процесса:
события, обязательства, долги, работы на проверке, сигналы куратору.

### 4.2. Прикладные (от Универкона целевым приложениям)

Универкон адресно маршрутизирует уведомления в Дидактикон. В
большинстве случаев — не actionable, попадают в инбокс, не на дашборд.

### 4.3. Критические (broadcast всем приложениям ОО)

Универкон выступает шиной критических уведомлений. На дашборд
попадают как `external_action` (§7.X). Статус прочтения
синхронизируется через Универкон — eventual через polling.

---

## 5. Модель карточки

### 5.1. Общая шапка

```json
{
  "id": "card-...",
  "kind": "event" | "form_deadline" | "event_debt" | "academic_debt"
        | "delivery_required" | "active_attempt"
        | "teacher_event_debt" | "submissions_to_grade"
        | "module_close_required" | "appeals" | "grade_override_pending"
        | "group_attendance_summary" | "group_debts_summary" | "student_at_risk"
        | "child_attendance_alert" | "child_debts_alert" | "child_at_risk"
        | "external_action",
  "source": "local" | "targeted" | "critical",
  "urgency": 0..100,
  "due_at": "ISO8601" | null,
  "title": "...",
  "subtitle": "...",
  "action": { ... } | null,
  "details": { ... }
}
```

### 5.2. Принцип расширяемости

Новый kind добавляется в Универконе и в Дидактикон-backend **без
обновления PWA**, если PWA умеет рендерить fallback по шапке.

---

## 6. Конфигурации дашборда по контекстам

### 6.1. Конфигурация: студент (role=student)

Шесть локальных kind + `external_action`.

| Kind | Семантика | Action |
|---|---|---|
| `event` | Учебное событие сегодня | open_event |
| `form_deadline` | Открытое обязательство ≤3 дня | open_form |
| `event_debt` | Событие с непогашенным | open_event_debt |
| `academic_debt` | Долг уровня дисциплины | open_academic_debt |
| `delivery_required` | Физическая работа готова, не сдана | open_delivery |
| `active_attempt` | Идёт extended-попытка с дедлайном | open_attempt |
| `external_action` | Критическое уведомление | open_external |

**Апелляция** на оценку — функция внутри карточки результата
(оценённой работы), не отдельный kind дашборда. Подаётся в окне срока
подачи (политика подразделения). Подача — целиком в Дидактиконе,
рассмотрение — у senior_grader.

### 6.2. Конфигурация: преподаватель (role=teacher, kind=instructor)

Четыре локальных kind + `external_action`.

| Kind | Семантика | Action |
|---|---|---|
| `event` | Моё ближайшее занятие сегодня | open_event_teacher |
| `teacher_event_debt` | Моя методическая недоработка по событию | open_event_teacher → Формы контроля |
| `submissions_to_grade` | Работы на проверке | open_submissions_to_grade |
| `module_close_required` | Нужно завершить работу с модулем | open_module_completion |
| `external_action` | Критическое уведомление (включая объяснительные) | open_external |

**Объяснительная по перенесённому событию** — внешний документ,
открывается в ЛК сотрудника по deep-link через `external_action`. Не
отдельный локальный kind.

**Закрытие модуля** — не в Дидактиконе. Преподаватель в Дидактиконе
**завершает свою работу** с модулем (внесение недостающих оценок,
раздача педагогических бонусов, галочка «я всё»). Само закрытие
модуля на уровне ОО делает деканат/завкафедрой в Универконе.

### 6.3. Конфигурация: старший проверяющий (role=teacher, kind=senior_grader)

Три локальных kind + `external_action`.

| Kind | Семантика | Action |
|---|---|---|
| `submissions_to_grade` | Очередь работ подразделения на проверке (расширенная выборка) | open_submissions_to_grade (с областью senior_grader) |
| `appeals` | Поданные апелляции | open_review_requests → Апелляции |
| `grade_override_pending` | Запросы на переопределение оценки | open_review_requests → Переопределения |
| `external_action` | Критическое уведомление | open_external |

### 6.4. Конфигурация: куратор (role=teacher, kind=curator) — НАБЛЮДАТЕЛЬНАЯ

Три **сигнальных** локальных kind + `external_action`.

| Kind | Семантика | Когда появляется | Action |
|---|---|---|---|
| `group_attendance_summary` | Сводка посещаемости группы | при alert (отклонение от нормы) | open_group → Посещаемость |
| `group_debts_summary` | Сводка долгов группы | при alert | open_group → Долги |
| `student_at_risk` | Студенты группы в зоне отчисления | при alert | open_group → Группа (фильтр риск) |
| `external_action` | Критическое уведомление | стандартно | open_external |

Куратор **не имеет действий, меняющих учебные факты**. Только
наблюдение. Точечное вмешательство (звонок студенту, разговор) — **вне
Дидактикона**.

Раздел «Моя группа» — самостоятельная поверхность с вкладками: Группа
/ Посещаемость / Долги / Расписание / Заметки.

Логика появления карточек: Универкон в ответе соответствующего метода
ставит флаг `has_alert: true|false`. Если `false` — карточка не
появляется на дашборде.

### 6.5. Конфигурация: родитель (role=parent) — НАБЛЮДАТЕЛЬНАЯ

Три **сигнальных** локальных kind + `external_action`. Структурно
симметрична кураторской.

| Kind | Семантика | Когда появляется | Action |
|---|---|---|---|
| `child_attendance_alert` | Посещаемость ребёнка ниже порога | при alert | open_child → Посещаемость |
| `child_debts_alert` | У ребёнка появились долги | при alert | open_child → Долги |
| `child_at_risk` | Ребёнок в зоне риска отчисления | при alert | open_child → Ребёнок (фильтр риск) |
| `external_action` | Критическое уведомление (договор, оплата) | стандартно | open_external |

Родитель **не имеет действий, меняющих учебные факты**. Только
наблюдение и реакция вне Дидактикона (звонок ребёнку, обращение в
деканат, контакт с куратором).

При нескольких детях — переключение контекста через шапку приложения,
один ребёнок за раз. Не смешиваем дашборды разных детей в одну ленту.

Раздел «Мой ребёнок» — самостоятельная поверхность с вкладками:
Ребёнок / Посещаемость / Долги / Расписание / БРС.

---

## 7. Спецификация карточек по kind

### 7.1. event (студент)

Показывает ближайшее предстоящее событие сегодня.

**Шапка:** `kind: "event"`, `source: "local"`, `due_at` = момент начала.

**details:**

```json
{
  "event_id": "evt:...",
  "event_kind": "lecture" | "seminar" | "lab" | "exam" | "retake" | "...",
  "discipline_id": "disc:...",
  "discipline_title": "...",
  "teacher_name": "...",
  "format": "offline" | "online" | "hybrid",
  "room": "..." | null,
  "meeting_url": "..." | null,
  "package_ref": "pkg:..." | null,
  "has_pre_event_bonus": true | false,
  "related_debts": { "count": 2, "kinds": ["attendance", "form_homework"] }
}
```

**action:** `{ "kind": "open_event", "target_id": event_id }`.

### 7.2. form_deadline (студент)

См. v1.0 §6.2. Без изменений.

**action:** `{ "kind": "open_form", "target_id": obligation_id }`.

### 7.3. event_debt (студент)

См. v1.1 §6.3. Без изменений.

Бонусные формы не входят в `obligations` (не порождают долги).
Незаназначенная вариативная — не долг студента (долг педагога).

**action:** `{ "kind": "open_event_debt", "target_id": event_id }`.

### 7.4. academic_debt (студент)

См. v1.0 §6.5. Без изменений.

`recovery_options.online` всегда `available: false` (промежуточная
аттестация требует слот).

**action:** `{ "kind": "open_academic_debt", "target_id": discipline_id }`.

### 7.5. delivery_required (студент)

См. v1.0 §6.6. Без изменений.

**action:** `{ "kind": "open_delivery", "target_id": obligation_id }`.

### 7.6. active_attempt (студент) — НОВЫЙ В v1.2

Идёт extended-попытка (форма с `time_model: extended`), переживающая
событие. Карточка-предупреждение «не забудь завершить вовремя».

**Шапка:** `kind: "active_attempt"`, `source: "local"`, `due_at` =
`launched_at + duration_minutes`, `title` = «Идёт: <форма> по
<дисциплина>», `subtitle` = «Осталось N минут».

**details:**

```json
{
  "attempt_id": "att:...",
  "form_control_id": "fc:...",
  "form_kind": "control_work" | "essay" | "test" | "...",
  "discipline_id": "disc:...",
  "discipline_title": "...",
  "started_at": "...",
  "deadline_at": "...",
  "remaining_minutes": 12
}
```

**Уход с дашборда:** в момент сдачи или истечения дедлайна.

Только для extended-форм. Inline-формы принудительно завершаются с
концом события (§ блока III); карточка `active_attempt` для inline не
рождается.

**action:** `{ "kind": "open_attempt", "target_id": attempt_id }`.

### 7.7. event (instructor)

Моё ближайшее занятие сегодня.

**Шапка:** `kind: "event"`, `source: "local"`, `due_at` = момент
начала.

**details:**

```json
{
  "event_id": "evt:...",
  "event_kind": "...",
  "discipline_id": "disc:...",
  "discipline_title": "...",
  "groups": ["ИВТ-21"],
  "format": "...",
  "room": "..." | null,
  "meeting_url": "..." | null,
  "package_ref": "pkg:...",
  "registration_count": 12,
  "registration_expected": 18,
  "current_state": "запланировано" | "регистрация" | "регистрация_закрыта" | "идёт",
  "pre_event_bonuses_picked": 3
}
```

`pre_event_bonuses_picked` — сколько pre_event-бонусов уже взято
студентами (для информирования педагога к занятию).

**action:** `{ "kind": "open_event_teacher", "target_id": event_id }`.
Дефолтная вкладка — «Обзор».

### 7.8. teacher_event_debt (instructor)

Методическая недоработка педагога по событию: незаназначенная
вариативная форма для конкретных студентов; обязательная форма, не
запущенная за событие.

**Шапка:** `kind: "teacher_event_debt"`, `source: "local"`, `due_at`
= дата закрытия рейтинга по дисциплине.

**details:**

```json
{
  "event_id": "evt:...",
  "event_date": "...",
  "discipline_id": "disc:...",
  "discipline_title": "...",
  "issues": [
    {
      "type": "unassigned_variable",
      "assignment_group": "coverage-topic-3",
      "affected_students": ["stu:...", "stu:..."]
    },
    {
      "type": "unlaunched_required",
      "form_control_id": "fc-control-work-3"
    }
  ]
}
```

**action:** `{ "kind": "open_event_teacher", "target_id": event_id,
"focus_tab": "forms_control" }`. Открывает педагогическую проекцию
карточки события с дефолтной вкладкой «Формы контроля» и
подсвеченной проблемой.

### 7.9. submissions_to_grade (instructor / senior_grader)

Очередь работ на проверке.

**Шапка:** `kind: "submissions_to_grade"`, `source: "local"`, `due_at`
= ближайший дедлайн оценивания.

**details:**

```json
{
  "queue_size": 24,
  "by_discipline": [
    { "discipline_id": "disc:...", "discipline_title": "...", "count": 18 }
  ],
  "oldest_pending_at": "...",
  "nearest_deadline_at": "...",
  "scope_hint": "own" | "department"
}
```

Источник: Тестикон через прокси Дидактикон-backend.

**action:** `{ "kind": "open_submissions_to_grade", "scope":
"own" | "department" }`. Переход в **раздел «Работы на проверке»** —
почтовый клиент с деревом ящиков-контекстов педагога. Структура:
- *Ящики* — контексты педагога: instructor по дисциплинам, senior_grader при наличии.
- *Папки* — Входящие / Отложенные / Оценённые / Отклонённые / Поиск.
- *Список* — работы в выбранной папке.
- *Фокус* — выбранная работа со шкалой оценки или критериями.

При `scope: "own"` открывается ящик текущего instructor-контекста.
При `scope: "department"` — ящик senior_grader (расширенная выборка
по подразделению).

### 7.10. module_close_required (instructor)

Нужно завершить работу педагога с модулем (внести недостающие
оценки, раздать педагогические бонусы при необходимости, заявить о
завершении).

**Шапка:** `kind: "module_close_required"`, `source: "local"`,
`due_at` = плановая дата закрытия модуля.

**details:**

```json
{
  "module_id": "mod:...",
  "module_title": "...",
  "discipline_id": "disc:...",
  "discipline_title": "...",
  "groups": ["ИВТ-21", "ИВТ-22"],
  "planned_close_at": "...",
  "pending_evaluations_count": 8,
  "students_with_open_obligations": 7,
  "students_total": 24
}
```

**action:** `{ "kind": "open_module_completion", "target_id":
module_id }`. Переход в **процедуру завершения работы педагога с
модулем** — экран с чек-листом недоделанного и кнопкой «Я всё».

Закрытие модуля на уровне ОО — НЕ в Дидактиконе. Это делает
деканат/завкафедрой в Универконе по факту `teacher.module_work_completed`
от данного педагога.

### 7.11. appeals (senior_grader)

Поданные апелляции, требующие рассмотрения.

**Шапка:** `kind: "appeals"`, `source: "local"`, `due_at` = срок
рассмотрения.

**details:**

```json
{
  "count": 3,
  "oldest_submitted_at": "...",
  "nearest_deadline_at": "..."
}
```

**action:** `{ "kind": "open_review_requests", "tab": "appeals" }`.
Переход в **раздел «Рассмотрение запросов»** — почтовый клиент с
двумя ящиками: «Апелляции» и «Переопределения». Открывается ящик
«Апелляции».

### 7.12. grade_override_pending (senior_grader)

Запросы преподавателей на переопределение оценок, требующие
рассмотрения старшего проверяющего.

**Шапка:** `kind: "grade_override_pending"`, `source: "local"`,
`due_at` = срок рассмотрения.

**details:** аналогично `appeals`.

**action:** `{ "kind": "open_review_requests", "tab":
"grade_overrides" }`. Переход в раздел «Рассмотрение запросов»,
ящик «Переопределения».

### 7.13. group_attendance_summary (curator) — СИГНАЛЬНАЯ

Сводка посещаемости группы — появляется при alert.

**Шапка:** `kind: "group_attendance_summary"`, `source: "local"`,
`due_at: null`.

**details:**

```json
{
  "group_id": "grp:ivt-21",
  "group_title": "ИВТ-21",
  "period_start": "...",
  "period_end": "...",
  "attendance_rate": 0.65,
  "students_below_threshold": 5,
  "threshold": 0.70,
  "alert_reason": "rate_below_threshold" | "trend_declining"
}
```

**action:** `{ "kind": "open_group", "target_id": group_id, "tab":
"attendance" }`. Переход в раздел «Моя группа», вкладка
«Посещаемость».

### 7.14. group_debts_summary (curator) — СИГНАЛЬНАЯ

Сводка долгов группы — при alert.

**Шапка:** `kind: "group_debts_summary"`, `source: "local"`,
`due_at: null`.

**action:** `{ "kind": "open_group", "target_id": group_id, "tab":
"debts" }`.

### 7.15. student_at_risk (curator) — СИГНАЛЬНАЯ

Студенты группы в зоне отчисления — при alert.

**Шапка:** `kind: "student_at_risk"`, `source: "local"`, `due_at:
null`.

**details:**

```json
{
  "group_id": "grp:ivt-21",
  "at_risk_count": 3,
  "students": [
    { "student_context_id": "stu:...", "name": "...", "risk_factors": ["..."] }
  ]
}
```

**action:** `{ "kind": "open_group", "target_id": group_id, "tab":
"members", "filter": "at_risk" }`.

### 7.16. child_attendance_alert (parent) — СИГНАЛЬНАЯ

Посещаемость ребёнка ниже порога.

**Шапка:** `kind: "child_attendance_alert"`, `source: "local"`,
`due_at: null`.

**details:**

```json
{
  "child_id": "stu:...",
  "child_name": "...",
  "attendance_rate": 0.60,
  "threshold": 0.70,
  "period_start": "...",
  "period_end": "..."
}
```

**action:** `{ "kind": "open_child", "target_id": child_id, "tab":
"attendance" }`. Переход в раздел «Мой ребёнок», вкладка
«Посещаемость».

### 7.17. child_debts_alert (parent) — СИГНАЛЬНАЯ

У ребёнка появились долги / горящие обязательства.

**Шапка:** `kind: "child_debts_alert"`, `source: "local"`, `due_at:
null`.

**action:** `{ "kind": "open_child", "target_id": child_id, "tab":
"debts" }`.

### 7.18. child_at_risk (parent) — СИГНАЛЬНАЯ

Ребёнок в зоне риска отчисления.

**Шапка:** `kind: "child_at_risk"`, `source: "local"`, `due_at:
null`.

**details:**

```json
{
  "child_id": "stu:...",
  "child_name": "...",
  "risk_factors": [
    "academic_debt_overdue",
    "attendance_below_critical",
    "..."
  ]
}
```

**action:** `{ "kind": "open_child", "target_id": child_id, "tab":
"main", "filter": "at_risk" }`.

### 7.19. external_action (все контексты)

Критическое уведомление с действием в другой системе. Сюда же
попадают:

- Уведомление педагогу о необходимости подать объяснительную
  (deep-link в ЛК сотрудника).
- Уведомление студенту/родителю об оплате (deep-link в финансовый ЛК).
- Уведомление о требующих подписи документах (deep-link в ЭДО).
- Уведомления медблока, общежития, и прочих систем ОО.

**Шапка:** `kind: "external_action"`, `source: "critical"`, `due_at`
= момент дедлайна действия (если есть).

**details:**

```json
{
  "notification_id": "ntf:...",
  "source_system": "lk_employee" | "lk_payments" | "edm" | "dormitory" | "...",
  "external_id": "...",
  "deep_link": "lkemp://documents/explanation/new?event_id=...",
  "fallback_url": "https://lk.example.org/documents/..."
}
```

**action:** `{ "kind": "open_external", "deep_link": "...",
"fallback_url": "..." }`. PWA пытается открыть deep-link; если не
сработал — переходит на fallback_url.

**Уход с дашборда:** при отметке «прочитано» (синхронизируется через
Универкон во все приложения).

---

## 8. Уважительность — общий принцип

Уважительность отсутствия или несвоевременного выполнения —
параллельный независимый процесс от закрытия обязательства.
Закрывается актом ОО: `closed_by_document` или `closed_by_order`.
Висит `open` бесконечно, если ничего не решено. Автоперевода в
«неуважительный» нет.

Карточка `event_debt` не уходит с дашборда студента, пока
уважительность дисциплинарного в `open`.

---

## 9. Сборщик дашборда — Дидактикон-backend

### 9.1. Алгоритм сборки

```
1. PWA вызывает feed.get(context_id, limit=5).
2. Backend проверяет кеш (TTL 60 секунд).
3. Если кеш протух — batch JSON-RPC ко всем источникам конфигурации.
4. Источники возвращают сырые факты.
5. Backend упаковывает в карточки, приоритизирует, режет top-5.
6. Кеш обновляется.
7. Ответ возвращается PWA.
```

### 9.2. Источники batch по конфигурациям

**Student** (6+1 kind):
- Универкон: `schedule.upcoming`, `obligations.open`,
  `debts.event_grouped`, `debts.academic`, `attempts.active`.
- Универкон критический: `notifications.critical.list`.

**Instructor** (4+1 kind):
- Универкон: `schedule.upcoming.teacher`, `teacher_debts.events`,
  `teacher_debts.modules`.
- Тестикон (через прокси): `submissions.pending`.
- Универкон критический: `notifications.critical.list`.

**Senior_grader** (3+1 kind):
- Тестикон: `submissions.pending` (расширенная выборка по scope),
  `appeals.list`, `grade_override.pending`.
- Универкон критический: `notifications.critical.list`.

**Curator** (3+1 kind, все сигнальные):
- Универкон: `group.attendance_summary`, `group.debts_summary`,
  `group.students_at_risk` — каждый возвращает `has_alert: bool`.
  При `false` — карточка не порождается.
- Универкон критический: `notifications.critical.list`.

**Parent** (3+1 kind, все сигнальные):
- Универкон: `child.attendance_alert`, `child.debts_alert`,
  `child.at_risk` — каждый с `has_alert`.
- Универкон критический: `notifications.critical.list`.

### 9.3. Прокси Тестикона

Дидактикон-backend ходит в Тестикон от service-токена. PWA никогда не
ходит в Тестикон напрямую.

---

## 10. Приоритизация

`urgency` — число от 0 до 100. Композитная формула:

```
urgency = base(kind, subtype) × time_factor(due_at) × risk_multiplier(state)
```

`external_action` критического канала имеет высокий базовый вес.

Сигнальные карточки (curator/parent) имеют высокий базовый вес — они
по определению про отклонение.

---

## 11. Контракт с PWA

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "feed.get",
  "params": {
    "context_id": "stu:..." | "tch:..." | "par:...",
    "limit": 5
  }
}
```

Ответ:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "cards": [ ... top-N карточек по urgency ... ],
    "total_actionable": 12,
    "has_more": true,
    "generated_at": "ISO8601",
    "cache_ttl_seconds": 60
  }
}
```

---

## 12. Производное архитектурное решение для пакета занятия

Атрибут `allowed_modes` пакета:

```yaml
package:
  allowed_modes:
    - live              # запуск в момент события
    - recovery_online   # онлайн-погашение долга
    - self_study_async  # самостоятельное изучение
```

Концепция пакета (`lesson-package-concept.md`) получит соответствующую
поправку.

---

## 13. Педагогический бонус — отдельный механизм

Новая сущность, **не из пакета и не из ФОС**. Педагог в любой момент
семестра может дать студенту дополнительные баллы за активность,
сообразительность, помощь сокурсникам и т. п.

Атрибуты:
- `student_context_id`
- `discipline_id` + `module_id`
- `points`
- `reason` (свободный текст)
- `awarded_by` (педагог)
- `awarded_at`

Лимиты — политика подразделения (например, не более 10 баллов на
студента за модуль). Прозрачен студенту (видит в траектории с
указанием причины). Учитывается в БРС наравне с пакетными формами.

Поправки накапливаются:
- К концепции пакета: явное указание, что педагогический бонус —
  вне пакета.
- К академической концепции §7: педагогический бонус как компонент БРС.

---

## 14. Разделы Дидактикона (целевые поверхности action)

Список целевых разделов, в которые ведут action карточек:

| Раздел | Кто использует | Из каких action |
|---|---|---|
| Карточка события (студентская проекция) | student | open_event |
| Карточка события (педагогическая проекция) | instructor | open_event_teacher |
| Карточка обязательства | student | open_form |
| Карточка долга по событию | student | open_event_debt |
| Карточка академзадолженности | student | open_academic_debt |
| Карточка передачи работы | student | open_delivery |
| Карточка активной попытки | student | open_attempt |
| Работы на проверке | instructor, senior_grader | open_submissions_to_grade |
| Рассмотрение запросов | senior_grader | open_review_requests |
| Завершение работы с модулем | instructor | open_module_completion |
| Моя группа | curator | open_group |
| Мой ребёнок | parent | open_child |
| Внешнее приложение | все | open_external |

Описание каждого раздела как самостоятельной поверхности —
отдельные документы. В блоке III v0.3 описана педагогическая
проекция карточки события.

---

## 15. Что в этой версии не описано

1. **Раздел полного списка долгов** с фильтрами — отдельный раздел.
2. **Раздел архива** оценённых работ для педагога.
3. **Канал уведомлений (Notifications/Inbox)** — отдельный документ.
4. **Спецификации разделов:** «Работы на проверке», «Рассмотрение
   запросов», «Моя группа», «Мой ребёнок» — самостоятельные документы.

---

## 16. Что синхронизировать с командой Универкона и Тестикона до старта

С Универконом:

1. JSON-схемы всех методов дашборда (§9.2).
2. Методы `teacher_debts.events`, `teacher_debts.modules`.
3. Методы `group.*` и `child.*` с флагом `has_alert`.
4. Метод `attempts.active` для extended-форм.
5. Канал критических уведомлений.

С Тестиконом:

6. Метод `submissions.pending(grader_context_id)` со scope.
7. Методы `appeals.list`, `grade_override.pending`.

PWA ↔ Дидактикон-backend:

8. Метод `feed.get`.

---

## 17. Связанные документы

- `didakticon-block-1-identity.md` v1.1.
- `didakticon-block-3-event-lifecycle.md` v0.3 — учебное событие;
  источник `event`, `event_debt`, `teacher_event_debt`,
  педагогическая проекция, runtime-пульт.
- `academic_concept.pdf` — академический контур; получит поправку
  про педагогический бонус (§7).
- `lesson-package-concept.md` — концепция пакета; получит поправки.
- `testikon-concept.md` — источник `submissions_to_grade`, `appeals`,
  `grade_override_pending`.

---

## Журнал изменений

- **v1.0** (29.06.2026) — первичная фиксация дашборда обучающегося.

- **v1.1** (29.06.2026) — переименование в «Дашборд» для всех ролей.
  Три источника карточек, `external_action`, четыре педагогические
  конфигурации, родительская как read-only.

- **v1.2** (30.06.2026) — actions всех педагогических kind определены.
  Упразднён kind `explanation_required` (объяснительная — кадровый
  документ в ЛК сотрудника, доходит до педагога через
  `external_action`). Конфигурация instructor сокращена до 5 kind.
  Перерисована конфигурация родителя — теперь **сигнальная**
  (3 kind + `external_action`) по аналогии с куратором, не read-only
  проекция студенческой. Карточки куратора и родителя помечены как
  сигнальные (появляются только при `has_alert: true`). Добавлен kind
  `active_attempt` для extended-форм с активной попыткой,
  переживающей событие. Введён принцип разделения ролей на
  деятельные и наблюдательные. Введена сущность «педагогический
  бонус» как отдельный механизм (§13). Добавлен раздел «Разделы
  Дидактикона» (§14) — карта целевых поверхностей для actions.
