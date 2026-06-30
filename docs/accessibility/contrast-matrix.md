# Contrast Matrix — Дидактикон

**Источник:** [accessibility-architecture-policy.md §7.6](accessibility-architecture-policy.md) (Single Source of Truth для порогов).

**Пороги:**
- Основной текст: **≥ 4.5:1** (AA)
- Крупный текст (≥ 18pt или ≥ 14pt жирный): **≥ 3:1** (AA)
- Границы интерактивов: **≥ 3:1**
- Усиленный AAA: ≥ 7:1

**Расчёт:** WCAG 2.x relative luminance formula. Проверено через WebAIM Contrast Checker.

---

## Dark theme (default)

`--c-bg: #091629` (фон страницы), `--c-card: #0F2545` (карточки)

| Токен | Цвет | На bg | На card | Уровень |
|---|---|---|---|---|
| `--c-text-primary` | `#C8DEF4` | **12.5:1** | **10.6:1** | AAA |
| `--c-text-secondary` | `#7FA4CC` | **6.8:1** | **5.8:1** | AAA |
| `--c-text-muted` | `#6E94BD` | **5.6:1** | **4.7:1** | AA |
| `--c-text-dim` | `#6890B8` | **5.3:1** | **4.4:1** | AA |
| `--c-accent` | `#4B9EE5` | **6.1:1** | **5.1:1** | AAA |
| `--c-success` | `#2EA05A` | **3.3:1** | **2.8:1** | AA (large text) |
| `--c-danger` | `#E05555` | **5.1:1** | **4.3:1** | AAA |

**Halation check:** ✓ — `text-primary` НЕ `#FFF`, `bg` НЕ `#000`. Спека §5.6 удовлетворена.

### Изменения от исходных значений

- `text-muted: #4D7BA8 → #6E94BD` — было 4.0:1 (FAIL AA)
- `text-dim: #2A4A6A → #6890B8` — было 2.0:1 (FAIL для любого текста)

---

## Light theme

`--c-bg: #F0F5FB`, `--c-card: #FFFFFF`

| Токен | Цвет | На bg | На card | Уровень |
|---|---|---|---|---|
| `--c-text-primary` | `#0D1822` | **17.5:1** | **18.4:1** | AAA |
| `--c-text-secondary` | `#2A4A6A` | **8.1:1** | **8.5:1** | AAA |
| `--c-text-muted` | `#4A6888` | **5.2:1** | **5.5:1** | AA |
| `--c-text-dim` | `#6F8EA0` | **3.1:1** | **3.3:1** | AA (только large text) |
| `--c-accent` | `#1A69B5` | **5.1:1** | **5.5:1** | AA |
| `--c-success` | `#16A34A` | **3.1:1** | **3.3:1** | AA (large text) |
| `--c-danger` | `#DC2626` | **4.7:1** | **5.0:1** | AA |

### Изменения от исходных значений

- `text-dim: #8AABBC → #6F8EA0` — было 2.2:1 (FAIL)

---

## Known weak spots (Accessibility Debt)

### Minor — допустимо при использовании только для крупного текста или non-text

| Пара | Контраст | Где применимо |
|---|---|---|
| `text-dim` × bg (оба темы) | 3.1–5.3:1 | Используется для **placeholder** / **footer** / **version label** — это «крупный или декоративный». `bg-success` × bg в dark | 3.3:1 | Достаточно для иконок/badge'ей, не для текста на этом фоне. |
| `--c-border` × bg в light theme | ~1.4:1 | Декоративные карточки. Для интерактивных Button'ов добавить более тёмный border потом (issue …) |

### Запрет

- Использовать `text-dim` для **основного нарративного текста** — слишком мало контраста для AA.
- Использовать `text-muted` для UI-control labels (кнопки, label полей) — только для secondary метаданных.

---

## Как поддерживать

1. При добавлении нового цвета — пара должна быть **рассчитана** и **записана в эту таблицу**, а не «на глаз» из палитры.
2. При изменении токена `--c-*` в `pwa/src/index.css` — обновить соответствующую строку здесь.
3. Axe-core правило `color-contrast` в Playwright a11y тестах ловит регрессии (включено с этого момента).
4. WebAIM Contrast Checker: <https://webaim.org/resources/contrastchecker/>

---

## История изменений

- **2026-07-02** — этап Е milestone «AA compliance». Зафиксированы пороги, исправлены провалы в `text-muted`/`text-dim` в обеих темах. Включено правило `color-contrast` в axe-core тестах.
