/**
 * usePersonIdLabel — приоритет:
 *  1. BRANDING_PERSON_ID_LABEL из админки (если задан)
 *  2. Локализованный t("eivLabel") как дефолт
 *
 * Используется в местах где отображается код ID физлица (StatusBar, Profile, RoleSelector).
 */
import { useBranding } from "./useBranding.js";
import { useLocale } from "../locale.js";

export function usePersonIdLabel(): string {
  const branding = useBranding();
  const { t } = useLocale();
  return branding.personIdLabel?.trim() || t("eivLabel");
}
