# Changelog

Продуктовая история Дидактикона. Не каждый коммит — а вехи и заметные изменения.

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/) ·
Версии: семантика «Block X.этап Y» (мы движемся по [блоку 1 спеки][block1]).

Технический changelog коммитов — в `git log` (формат [Conventional Commits][cc]).

[block1]: https://example/didakticon-block-1-identity.md
[cc]: https://www.conventionalcommits.org/ru/v1.0.0/

---

## [Unreleased]

В работе после Block I.

---

## [Block I — Identity & Context] — 2026-06-29

Полная имплементация [блока I][block1]: единая identity через Univerkon
(пока Auth0 как mock-OIDC), мульти-роль, контекст в URL, e-Student с QR.
PWA готова к подключению реального Univerkon — изменится только `glue/.env`.

### Идентичность и роли
- **Auth0 Login Action** эмитит `https://eios/roles[{name, modifiers?}]` и
  `https://eios/eiv` в id_token, плюс стандартные OIDC claims (`name`,
  `given_name`, `family_name`, `middle_name`)
- **10 тестовых пользователей** покрывают сценарии: single-role, multi-role,
  multi-context, teacher с модификаторами (`senior_grader`, `curator`),
  examiner, applicant
- **PWA `getUser()`** возвращает `PersonIdentity` с полным массивом `roles[]`;
  неизвестные модификаторы игнорируются (forward-compat)

### Контексты и навигация
- **JSON-RPC `/api/rpc`** в glue, метод `identity.contexts.get` отдаёт mock
  по email — структура точно по §8.2 спеки
- **Multi-role физик**: новый экран `RoleSelector` («Я учусь / родитель /
  преподаю / экзаменатор / абитуриент») если у юзера >1 ролей; выбор живёт
  в `sessionStorage`, переживает F5
- **URL содержит контекст**: `/{role}/{contextId}/{view}` (например,
  `/student/stu:s1/schedule`). Старые ссылки `/schedule` каноникализируются
  автоматически. Back/forward сохраняет контекст
- **Кнопка «↩ Сменить роль»** в Профиле для multi-role физика

### Единый shell
- **UnifiedShell** заменяет StudentView + TeacherView (нетто −76 строк кода)
- Учитель теперь видит в Профиле всё то же что и студент: ЕИВ, личные данные,
  язык, тема, размер шрифта, «Мои роли», «Сменить роль», установка PWA
- Конфигурируемая надпись ID физлица (`BRANDING_PERSON_ID_LABEL` в админке) —
  «ЕИВ», «Студ. код», «UID», что захочет ОО

### e-Student card
- Полноэкранная карта обучающегося с QR-кодом (Block I §9)
- JWS-токен на 24 часа, выдаётся через `identity.e_student.issue`
- Принудительно светлая тема (для сканирования охраной на ярком свете)
- Кеш в `localStorage` — работает оффлайн до `exp`
- В demo-режиме токен генерится локально, без сети

### UX-победы
- **FOUC prevention** — тема и размер шрифта применяются до маунта React
- **Размер шрифта S/M/L** — accessibility-настройка, влияет на весь интерфейс
  через `--font-size-base` на root html
- **Активный chip** (тема/язык/шрифт) — solid accent + белый текст вместо
  субтильного 10% tint, заметнее
- **Splash после OIDC** — отдельный экран «Завершаем вход…» между Auth0
  callback и AppShell вместо мигания LoginScreen
- **LogoutScreen** — одноразовый экран после logout с кнопкой «Войти снова»
  и предупреждением про общий компьютер
- **Demo-блок lifecycle** — после первого входа сворачивается в одну ссылку
  «Демонстрационный вход ▾», разворачивается кликом
- **Button-унификация** — единый компонент `<Button>` в LoginScreen / RoleSelector
  / Profile / AppShell, согласованные размеры и варианты

### Технические улучшения
- Refactored `useAuth.ts`: `USE_MOCK` + `DEMO_PERSONA` вынесены в `auth/mock.ts`
  чтобы избежать circular import с `data/contexts.ts`
- Router возвращает `{route, ctx}` через `parsePath`, отдельный хук
  `useRouteContext()` для контекста — старые consumers через `useRoute()`
  не сломаны
- Glue `verifyBearerToken()` возвращает payload + Principal — нужно для RPC
  методов где смотрим roles/eiv из JWT
- PWA шлёт `id_token` вместо `access_token` (у Auth0 SPA без API-audience
  access_token opaque, не JWT)
- OIDC scope расширен до `openid profile email` — email нужен glue для
  поиска контекстов в mock-реализации
