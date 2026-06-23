# ЭИОС — студенческий контур поверх Univerkon

Тонкая электронная информационно-образовательная среда: студенческий PWA + плеер SCORM + сервис-клей, пристёгнутые к **1С:Univerkon** как ядру фактов и идентичности.

> **ЭИОС — спутник Univerkon, а не замена.** Univerkon владеет всеми фактами (траектория, события, ведомости, зачётка) и выдаёт идентичность (OIDC). ЭИОС ничем не владеет — отражает проекции и порождает свидетельства.

Полная концепция — [`docs/concept-eios.md`](docs/concept-eios.md). Контракты клея — [`docs/glue-contracts.md`](docs/glue-contracts.md).

## Быстрый старт — установка на VPS

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/iMironRU/Didaticon/main/manage.sh)
```

Скрипт спросит домен и параметры Univerkon, установит Docker, скачает образы из ghcr.io, поднимет стек с автоматическим HTTPS через Caddy (Let's Encrypt).

Повторный запуск того же скрипта — меню управления: обновить, настроить, удалить.

## Архитектура (одним экраном)

```
Univerkon (1С)
   │  OIDC + JSON-RPC
   ▼
 [ glue ]  ← CMI-коммиты от PWA → граница → свидетельство → outbox → Univerkon
   │  /api/
   ▼
 [ pwa ]   ← студент: OIDC-вход → проекция → SCORM-плеер → офлайн-буфер → /commit
```

- **Univerkon** — единый источник фактов, вне горячего пути (буферы не дают простою 1С остановить обучение)
- **Клей** видит CMI, Univerkon — только свидетельства (форма хранения активности не протекает наружу)
- **Граница ≠ коммит**: свидетельство рождается только на терминальном исходе (`passed` / `failed` / `completed`)
- **Контент** — статический пакет SCORM на узле; иерархию держит Univerkon

## Карта репозитория

```
packages/contracts/       общие TS-типы (PWA ↔ клей ↔ Univerkon, правило границы)
glue/                     сервис-клей (Fastify/TS): коммиты, граница, свидетельство
pwa/                      студенческий PWA (React/Vite): OIDC, scorm-again, офлайн
mock/univerkon.ts         локальный mock Univerkon для разработки
docs/                     спеки — источник истины по контрактам и модели
docker-compose.yml        базовый стек (glue + postgres + nginx/pwa)
docker-compose.prod.yml   продакшн-оверрайд: Caddy (HTTPS) + образы из ghcr.io
manage.sh                 единый скрипт: установка / обновление / настройки / удаление
```

## Разработка локально

```bash
npm install
npm run mock        # mock Univerkon на :9000 (OIDC + JSON-RPC)
npm run dev:glue    # glue на :8080
npm run dev:pwa     # PWA на :5173
```

`.env`-файлы для локальной разработки уже в репо (указывают на `localhost:9000`).

## CI / образы

GitHub Actions: typecheck → build → API smoke-тест → push в ghcr.io.

| Образ | Тег |
|---|---|
| `ghcr.io/imironru/didaticon-glue` | `latest` / git sha / semver |
| `ghcr.io/imironru/didaticon-pwa`  | `latest` / git sha / semver |

Теги версий создаются при пуше тега `v*` (например `v0.2.0`).

## Статус

Walking skeleton (срез-1) пройден: OIDC → проекция → SCORM-плеер → CMI-коммиты → граница → свидетельство → Univerkon. Все швы прошиты и проверены smoke-тестом.

Открытые задачи на срез-2: PgStore для центрального узла, mTLS для кампусной зоны, `attemptId` от Univerkon.

## Лицензии

- Код — **MIT** ([`LICENSE`](LICENSE))
- Документы в `docs/` — **CC BY-SA 4.0** ([`LICENSE-docs`](LICENSE-docs)), часть iMironRU/edu-framework
