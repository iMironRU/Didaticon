import { applySwUpdate } from "../sw-update.js";
import { isPhone } from "./isPhone.js";
import { useLocale } from "../locale.js";
import { Button } from "../ui/Button.js";

interface Props {
  swUpdate: boolean;
}

export function StatusBar({ swUpdate }: Props) {
  const { t } = useLocale();

  if (!swUpdate || !isPhone()) return null;

  return (
    <div className="flex items-center px-3 py-1 bg-elevated border-t border-line shrink-0">
      <Button size="sm" onClick={applySwUpdate}>{t("updateApp")}</Button>
    </div>
  );
}
