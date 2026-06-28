import { Stub } from "./Stub.js";

export function LogsTab() {
  return (
    <Stub
      title="Логи"
      description="Последние ошибки glue, статус outbox-буфера (сколько событий ждут отправки в Univerkon), история перезапусков."
      todo="Появится когда понадобится оперативный аудит."
    />
  );
}
