# Accessibility — спецификации

Эта папка — **истина-первоисточник** для всех решений доступности в Дидактиконе.

## Документы

| Файл | Что внутри |
|---|---|
| [`accessibility-architecture-policy.md`](./accessibility-architecture-policy.md) | **Архитектурная политика** edu-framework (вся экосистема Univerkon). Читать первой. Принципы, инварианты, реестр числовых порогов (§7.6 — Single Source of Truth), матрица ответственности, классификация Accessibility Debt. |
| [`didakticon-accessibility.md`](./didakticon-accessibility.md) | **Технические требования** к Дидактикону как PWA. Конкретные правила: семантика, ARIA, focus management, контраст, тап-цели, формы, таблицы, тесты, пакеты уроков. |

## Несущие решения

Эти решения **не подлежат обсуждению** на уровне команды разработки:

1. **Соответствие AA** по ГОСТ Р 52872-2019 (= WCAG 2.1 AA) + выборочно WCAG 2.2 AA (Focus Not Obscured, Accessible Authentication) и AAA (Target Size 44×44).
2. **Один интерфейс**, без отдельной «версии для слабовидящих». Высокая контрастность — тема внутри общего UI.
3. **Accessibility — инвариант**, не feature. PR без соответствия чеклисту не сливается.
4. **Декларация по `/accessibility`** с разделом «Почему нет версии для слабовидящих» (защита от инерции ГОСТ Р 52872-2012).
5. **eslint-plugin-jsx-a11y** = `error` уровень, **axe-core в CI** блокирует merge на serious/critical.
6. **Дизайн-система** — единая точка реализации ARIA, не прикладной код.

## Реестр числовых порогов

См. `accessibility-architecture-policy.md`, §7.6. Все продуктовые документы и компоненты дизайн-системы **ссылаются** на пороги, **не дублируют** их.

Кратко:
- Контраст текста ≥ 4.5:1, крупного ≥ 3:1, границ интерактивов ≥ 3:1
- Тап-цели ≥ 44×44 CSS-px, между ними ≥ 8 px
- Шрифт ≥ 16 px (1 rem), межстрочный ≥ 1.5
- Минимум 320 px ширины без горизонтального скролла
- Мигание ≤ 3 вспышки/сек

## План работ

См. milestone [«AA compliance»](https://github.com/iMironRU/Didaticon/milestones) в репо.

Группировка по этапам:
- **А** — платформа разработки (линтер, CI, DoD)
- **Б** — базовая семантика (`<main>`, `<nav>`, skip-link, иерархия `<h1>`)
- **В** — SPA-навигация (focus management, document.title, aria-live)
- **Г** — hit-targets и focus visibility (44×44, scroll-margin)
- **Д** — таблицы (gradebook, schedule)
- **Е** — visual / motion (halation, contrast matrix, reduced-motion)
- **Ж** — формы (label, autocomplete, aria-describedby)
- **З** — `/accessibility` декларация + форма обратной связи
- **И** — `accessibility_preferences` на физлице
- **К** — тестирование (клавиатура, скринридер, Lighthouse)

См. issues с меткой `accessibility` для конкретных тикетов.
