# API-документация glue

Два протокола, две схемы — не смешиваем в одном файле.

| Файл | Протокол | Эндпоинт | Issue |
|---|---|---|---|
| `glue.openapi.json` | REST | `/commit`, `/resume`, `/projection`, `/admin/*` | [#68](https://github.com/iMironRU/Didaticon/issues/68) |
| `rpc.openrpc.json`  | JSON-RPC 2.0 | `/rpc` (`identity.*`, `feed.get`, `event.*`) | [#69](https://github.com/iMironRU/Didaticon/issues/69) |

Ошибки: REST — RFC 9457 Problem Details ([#66](https://github.com/iMironRU/Didaticon/issues/66),
`glue/src/errors.ts`). JSON-RPC — `{code, message, data}` с actionable-подсказками
([#67](https://github.com/iMironRU/Didaticon/issues/67), `glue/src/routes/rpc/rpcError.ts`).

## Как обновлять

**REST** (`glue.openapi.json`) — генерируется, не редактируется руками:
1. Добавь/поменяй JSON Schema в `schema: {...}` роута (см. `glue/src/routes/commit.ts` как образец)
2. `npm run openapi:generate --workspace=@eios/glue`
3. Закоммить изменившийся `glue.openapi.json` вместе с кодом роута
4. CI (`openapi:check`) зафейлится, если забыл — но лучше не полагаться на это

**JSON-RPC** (`rpc.openrpc.json`) — редактируется руками (генератора из Fastify-роутов
для OpenRPC не существует так же удобно, как `@fastify/swagger` для REST):
1. Новый метод в `glue/src/routes/rpc.ts` → добавь запись в `methods[]` этого файла:
   `name`, `params` (JSON Schema per параметр), `result.schema`, `errors` (обычно
   `AuthRejected` + `InternalError` из `components.errors`, плюс `InvalidParams`
   если хендлер бросает `RpcValidationError`)
2. Новый тип в результате → добавь в `components.schemas`, ссылайся через `$ref`
3. Проверь вручную (curl/httpie) что реальный ответ сервера совпадает со схемой —
   схема руками пишется, разъехаться с кодом легко

**Правило (см. память `feedback_api_documentation`):** документация обновляется
в том же PR/коммите что и код, не отдельным issue "когда-нибудь".

## Playground / Swagger UI

Осознанно не поднимаем runtime UI — статичные файлы дешевле и безопаснее в проде
(needs-decision зафиксирован в #68/#69). Смотреть схему — глазами в JSON или
через любой внешний OpenAPI/OpenRPC viewer локально.
