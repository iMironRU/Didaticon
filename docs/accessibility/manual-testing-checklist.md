# Ручная проверка доступности Дидактикона

Чеклист для этапа К milestone [AA compliance][milestone]. Автотесты (Playwright + axe-core, Lighthouse) уже зелёные — этот чеклист закрывает то, что машина не ловит: реальное взаимодействие со вспомогательными технологиями.

**Тестовая среда:** https://176-122-27-25.sslip.io
**Тестовые юзеры:** см. `auth0_branding.md` в памяти Claude или внутренней документации Auth0. Демо-режим без логина: `?demo=student` / `?demo=teacher`.
**Время прохождения:** ~45-60 минут.

[milestone]: https://github.com/iMironRU/Didaticon/milestone/1

---

## 1. Клавиатура (без мыши)

Открой `https://176-122-27-25.sslip.io/?demo=student`. Используй **только** Tab, Shift+Tab, Enter, Space, стрелки, Esc:

- [ ] **Skip-link** — первый Tab показывает голубую ссылку «Перейти к основному содержимому» сверху. Enter → фокус переезжает на основной контент
- [ ] **BottomNav** — Tab перебирает табы, Enter активирует. На активном табе `aria-current="page"` (можно проверить в инспекторе)
- [ ] **Полоса дней** в расписании — только выбранный день в Tab-order. Стрелки ←/→ переключают день и сразу его выбирают
- [ ] **Профиль** — Tab перебирает все настройки (тема/язык/шрифт + 5 a11y-toggle'ов + выход)
- [ ] **RoleSelector** (`?demo=parent-student`) — Tab по карточкам ролей, Enter выбирает
- [ ] **Confirm Dialog** (нажми Выйти в Профиле) — Esc закрывает, Tab не уходит за пределы, при закрытии фокус возвращается на кнопку, открывшую диалог
- [ ] **Gradebook expandable** — Enter раскрывает строку с пересдачей, ещё раз Enter сворачивает (aria-expanded переключается)
- [ ] **Профиль / accessibility toggle** — Space переключает чекбокс, описание читается

**Что должно работать:** все интерактивы достижимы без мыши, у каждого фокусируемого видимый focus-ring, никаких «ловушек» где Tab застревает.

---

## 2. Скринридер

### iOS Safari + VoiceOver

Включить: трижды нажать боковую кнопку (предварительно настроить в Settings → Accessibility → Accessibility Shortcut → VoiceOver).

Жесты: свайп вправо/влево — следующий/предыдущий элемент. Двойной тап — активация. Двумя пальцами скрабающий жест — назад.

- [ ] Открой PWA с домашнего экрана → VoiceOver объявляет заголовок главной страницы (через RouteAnnouncer)
- [ ] Переключи таб BottomNav → объявление имени экрана при смене route
- [ ] Открой Зачётку → «Зачётная книжка, таблица, N строк, 4 столбца», свайп вправо читает по ячейкам с заголовком столбца + строки
- [ ] Открой e-Student → «Студенческий билет», ФИО, программа, «Действует до …»
- [ ] Расписание → «понедельник 22 июня, есть занятия, вкладка, выбрана»
- [ ] Скриншот зачётки в landscape → таблица читается корректно

### Windows + NVDA

Установить с https://www.nvaccess.org/ → Ctrl+Alt+N включить.

- [ ] Те же сценарии что и VoiceOver
- [ ] Insert+F7 → список landmarks: должны быть **Banner** (Header), **Navigation** (BottomNav), **Main**, **Contentinfo** (StatusBar)
- [ ] Insert+F5 → список форм-полей (на /admin)
- [ ] Insert+F6 → список заголовков (h1 sr-only на каждом экране)
- [ ] H — следующий заголовок, F — следующее поле формы, B — кнопка, K — ссылка
- [ ] Ctrl+Alt+стрелки в таблице зачётки — навигация по ячейкам

### Особое внимание

- [ ] Динамические уведомления (toast при возвращении сети, route announcer) объявляются через aria-live
- [ ] Modal Confirm объявляется как «диалог», focus попадает внутрь, при закрытии возвращается

---

## 3. Симуляция дальтонизма

Chrome DevTools → ⋮ (трёхточечное меню в правой верхней панели DevTools) → More tools → **Rendering** → секция **Emulate vision deficiencies**:

- [ ] **Achromatopsia** (полное отсутствие цвета) — все статусы (Долг/Сдано/В процессе) различимы без красного-зелёного, есть иконки и текст
- [ ] **Protanopia** (нет восприятия красного)
- [ ] **Deuteranopia** (нет восприятия зелёного) — самая распространённая форма
- [ ] **Tritanopia** (нет восприятия синего)
- [ ] **Blurred vision** — текст остаётся читаемым

**Прогон по экранам:** Schedule (типы занятий), Performance (БРС-прогрессы), Gradebook (статусы оценок), Notifications (категории).

---

## 4. Зум

- [ ] Браузер 200% (Cmd/Ctrl + плюс несколько раз) → нет горизонтального скролла, всё помещается
- [ ] Браузер 400% → читаемо, layout не ломается катастрофически
- [ ] iOS Safari → жест pinch-to-zoom разрешён (не залочен viewport)
- [ ] Android Chrome → System font scale на максимум — текст в PWA масштабируется

---

## 5. Accessibility prefs в Профиле

Включай по одной, проверяй эффект:

- [ ] **Высокая контрастность** → толще границы (1.5px), focus-ring 3px вместо 2px, акцентные цвета ярче
- [ ] **Снижение анимаций** → пропадают transitions при смене темы, открытии Confirm, тосте «Сеть восстановлена»
- [ ] **Шрифт для дислексии** → буквы и слова раздвинуты, межстрочный интервал увеличен; особенно заметно в больших абзацах (/accessibility)
- [ ] **Пользуюсь скринридером** → пока без видимого эффекта (флаг для будущих UX-решений)
- [ ] **Нужно больше времени на тестах** → пока без эффекта (флаг для Тестикона)
- [ ] **Размер шрифта S → M → L** → весь интерфейс масштабируется (rem-based)

**Перезагрузка страницы (F5)** при включённой настройке → нет вспышки дефолтного состояния (FOUC prevention работает).

---

## 6. /accessibility страница

- [ ] Открыть `https://176-122-27-25.sslip.io/accessibility` без авторизации → загружается
- [ ] Все ссылки имеют подчёркивание (не полагаются только на цвет — WCAG 1.4.1)
- [ ] Кнопка «Написать об ограничении» открывает почтовый клиент с темой
- [ ] Раздел «Почему отсутствует отдельная версия для слабовидящих» виден
- [ ] Кнопка «Назад» возвращает в приложение / на /

---

## 7. Lighthouse (повторно после исправлений)

Запустить локально или через DevTools:

```bash
npx -y lighthouse https://176-122-27-25.sslip.io/ \
  --only-categories=accessibility --quiet \
  --chrome-flags="--headless --no-sandbox --ignore-certificate-errors"

npx -y lighthouse https://176-122-27-25.sslip.io/accessibility \
  --only-categories=accessibility --quiet \
  --chrome-flags="--headless --no-sandbox --ignore-certificate-errors"

npx -y lighthouse "https://176-122-27-25.sslip.io/?demo=student" \
  --only-categories=accessibility --quiet \
  --chrome-flags="--headless --no-sandbox --ignore-certificate-errors"
```

**Текущие baseline:**
- `/` LoginScreen — **1.00**
- `/accessibility` — **1.00**
- `/?demo=student` AppShell — **0.96** (decorative aria-hidden + строгий label-content-name-mismatch — Lighthouse false-positives, axe-core принимает)

---

## 8. Регистрация находок

Если нашёл что-то не работает:

1. Сделай скриншот
2. Создай issue: `gh issue create --label accessibility --milestone "AA compliance" --title "..."` ИЛИ через GitHub UI: https://github.com/iMironRU/Didaticon/issues/new
3. В описании укажи: вспомогательное средство (NVDA/VoiceOver/...), экран, ожидаемое vs реальное поведение
4. Классификация по политике §4.3:
   - **Critical** — полностью блокирует категорию пользователей (хотфикс)
   - **Major** — существенно затрудняет (фикс в спринт)
   - **Minor** — нарушение рекомендаций без блокировки (техдолг)

---

## 9. Связанные документы

- Политика: [`accessibility-architecture-policy.md`](./accessibility-architecture-policy.md)
- Технические требования: [`didakticon-accessibility.md`](./didakticon-accessibility.md)
- Контраст: [`contrast-matrix.md`](./contrast-matrix.md)
- Декларация: https://176-122-27-25.sslip.io/accessibility
- Беклог: https://github.com/iMironRU/Didaticon/issues?q=label%3Aaccessibility
