# ЭИОС — студенческий контур поверх Univerkon

Тонкая электронная информационно-образовательная среда: студенческий PWA + плеер SCORM + сервис-клей (фасад слоя активности), пристёгнутые к **1С:Univerkon** как ядру фактов и идентичности.

> Это **спутник** Univerkon, а не замена. Univerkon владеет всеми фактами (траектория, события, обязательства, записи, ведомости, зачётка) и выдаёт идентичность (OIDC). ЭИОС ничем не владеет — отражает проекции и порождает свидетельства.

Полная концепция — в [`docs/concept-eios.md`](docs/concept-eios.md). Здесь — карта репо и план первой сборки.

## Несущие идеи (одним экраном)

- **Univerkon — единый источник фактов и решений, но вне горячего пути.** Между студентом и ядром лежат буферы; недоступность 1С не останавливает обучение.
- **Клей видит CMI, Univerkon — только свидетельства.** Форма хранения активности за фасадом не протекает наружу (см. [`docs/glue-contracts.md`](docs/glue-contracts.md)).
- **Машина — только свидетель; факт рождает человек-валидатор** (ролевая модель — [`docs/15.8-rolevaya-model-udostoveryayushchiy-sloy.md`](docs/15.8-rolevaya-model-udostoveryayushchiy-sloy.md)).
- **Контент — статический лист на узле**, не структура. Иерархию держит Univerkon.
- **Граница ≠ коммит.** Свидетельство рождается на терминальном исходе учебного события; failed → отрицательная запись → пересдача.

## Карта репозитория

```
docs/                 спеки (источник истины по контрактам и модели)
packages/contracts/   общие TS-типы контрактов (PWA↔клей, клей↔Univerkon, правило границы)
glue/                 сервис-клей (Node/TS): приём прохождения, граница, проводка свидетельства
pwa/                  тонкий студенческий PWA (React/Vite): OIDC + scorm-again + офлайн-буфер
docker-compose.yml        центральный стек
docker-compose.edge.yml   оверрайд для кампусного edge-узла (локальный экзамен)
```

## Срез 1 — спина насквозь (walking skeleton)

Цель: один поток через все слои, чтобы прошить швы. Один студент, одна дисциплина, один проход.

1. Вход по OIDC против Univerkon (`pwa/src/auth/oidc.ts`).
2. PWA тянет проекцию дисциплины из Univerkon (`pwa/src/projections/trajectory.tsx`).
3. Запуск SCORM-узла через scorm-again в iframe (`pwa/src/player/`).
4. Коммиты CMI → IndexedDB → outbox → клей `commit` (`pwa/src/offline/`, `glue/src/routes/commit.ts`).
5. На терминальном исходе клей лепит свидетельство (`glue/src/boundary.ts`, `glue/src/svidetelstvo.ts`).
6. Клей проводит свидетельство в Univerkon (`glue/src/univerkon/client.ts`) → ведомость → зачётка-view.

Швы, которые этот срез проверяет: OIDC-хэндофф, маршрутизация коммитов, правило границы, RPC-контракт к Univerkon, проекция обратно в PWA.

## Запуск

```bash
npm install
docker compose up --build      # центральный стек: glue + postgres + статика + pwa
# кампусный edge-узел (локальный экзамен, SQLite):
docker compose -f docker-compose.yml -f docker-compose.edge.yml up --build
```

Перед запуском скопируй `glue/.env.example` → `glue/.env` и пропиши адрес Univerkon, секреты OIDC/JWT.

## Статус

Это **скелет**. Стабы помечены `TODO(срез-1)` и ссылаются на разделы спеков. Открытые вопросы — в `docs/glue-contracts.md` §8 и `docs/concept-eios.md` §10.

## Лицензии

- Код — **MIT** (`LICENSE`).
- Документы в `docs/` — **CC BY-SA 4.0** (`LICENSE-docs`), часть iMironRU/edu-framework.
