import { ConfigForm } from "../ConfigForm.js";

export function SettingsTab() {
  return (
    <div>
      <h2 className="text-fg text-base font-semibold mt-4">Настройки</h2>
      <p className="text-fg-muted text-sm mt-1 mb-2">
        Опциональные функции PWA.
      </p>
      <ConfigForm tab="settings" />
    </div>
  );
}
