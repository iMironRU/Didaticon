import { ConfigForm } from "../ConfigForm.js";

export function BrandTab() {
  return (
    <div>
      <h2 className="text-fg text-base font-semibold mt-4">Брендинг</h2>
      <p className="text-fg-muted text-sm mt-1 mb-2">
        Название, цвета, логотип, контакты поддержки. Применяется на странице входа и в шапке PWA.
      </p>
      <ConfigForm tab="brand" />
    </div>
  );
}
