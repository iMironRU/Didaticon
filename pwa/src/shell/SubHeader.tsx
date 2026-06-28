/**
 * SubHeader — back-кнопка + breadcrumb title.
 *
 * Используется на детальных экранах: lesson, unit, group, и т.д.
 * Фон тот же что у Header, border-bottom разделяет от тела экрана.
 */
import { useLocale } from "../locale.js";

interface Props {
  /** Хлебная крошка (название дисциплины / типа+предмета) */
  title:  string;
  onBack: () => void;
}

export function SubHeader({ title, onBack }: Props) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-elevated border-b border-line shrink-0">
      <button
        className="bg-transparent border-0 text-accent text-[0.9rem] cursor-pointer flex items-center gap-1 shrink-0"
        onClick={onBack}
      >
        <span className="text-xl">‹</span> {t("back")}
      </button>
      <div className="text-fg text-[0.85rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
        {title}
      </div>
    </div>
  );
}
