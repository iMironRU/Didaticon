## Что меняется

<!-- 1–3 строки. Зачем (мотивация), затем что (изменение). -->

## Скриншоты / видео (если UI)

<!-- Скрин до/после или короткий gif. Для смены тем — light + dark. -->

## Definition of Done — Accessibility (минимальный UI-чеклист)

Источник: [`docs/accessibility/accessibility-architecture-policy.md` §5.1](../blob/main/docs/accessibility/accessibility-architecture-policy.md).

- [ ] `npm run lint --workspace=pwa` зелёный (jsx-a11y без errors)
- [ ] Проходит `axe-core` без нарушений уровня **serious/critical**
- [ ] Все интерактивы достижимы клавиатурой (Tab/Esc/Enter/Space/стрелки)
- [ ] Видимый `focus-visible:ring` на всех фокусируемых элементах
- [ ] Контраст соответствует [§7.6 политики](../blob/main/docs/accessibility/accessibility-architecture-policy.md) в обеих темах (4.5:1 текст, 3:1 границы)
- [ ] Hit-target ≥ **44×44 px** для всех CTA-кнопок
- [ ] У всех `<img>` есть `alt` (декоративные — `alt=""` явно)
- [ ] У всех полей формы есть `<label>` или `aria-label`
- [ ] Иконочные кнопки имеют `aria-label`
- [ ] Динамические изменения объявляются через `aria-live` (где применимо)
- [ ] Используются компоненты дизайн-системы (`Button`, `Card`, `Dialog` и т.д.), а не самописные эквиваленты
- [ ] Не сломан при увеличении до 200% и при `prefers-reduced-motion`

## Definition of Done — общее

- [ ] `npm run typecheck` зелёный
- [ ] `npm run build` зелёный
- [ ] Тесты добавлены/обновлены (если применимо)
- [ ] CHANGELOG.md обновлён если это видимое пользователю изменение

## Связанные issue

<!-- `Closes #N` чтобы issue закрылась при merge. -->
Closes #
