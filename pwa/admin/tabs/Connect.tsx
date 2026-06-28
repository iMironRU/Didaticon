import { ConfigForm } from "../ConfigForm.js";

export function ConnectTab() {
  return (
    <div>
      <h2 className="text-fg text-base font-semibold mt-4">Подключение к Univerkon</h2>
      <p className="text-fg-muted text-sm mt-1 mb-2">
        Параметры OIDC + JSON-RPC. При смене с пометкой «↺ рестарт» — перезапустите glue после сохранения.
      </p>
      <ConfigForm tab="connect" />
    </div>
  );
}
