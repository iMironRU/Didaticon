import { useState } from "react";
import { useLocale } from "../../locale.js";
import type { Person, Learner } from "@eios/contracts";

interface Props {
  person:      Person;
  learners:    Learner[];
  currentId:   string;  // learnerId
  defaultId:   string;  // learnerId
  onSelect:    (learnerId: string) => void;
  onSetDefault:(learnerId: string) => void;
}

const CARD_OUTER_CLS = "border border-line rounded-xl mb-2.5 overflow-hidden";
const CARD_BTN_CLS =
  "block w-full text-left px-4 py-3.5 cursor-pointer bg-transparent border-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-inset";
const CARD_ACTIVE_CLS =
  "border-accent bg-[color-mix(in_srgb,var(--c-accent)_6%,var(--c-card))]";
const CARD_DEFAULT_CLS = "bg-surface";

export function ContextSwitcherScreen({
  person, learners, currentId, defaultId, onSelect, onSetDefault,
}: Props) {
  const { t } = useLocale();
  const [localDefault, setLocalDefault] = useState(defaultId);

  function handleSetDefault(id: string) {
    setLocalDefault(id);
    onSetDefault(id);
  }

  const title = person.personType === "parent" ? t("myChildren") : t("learnersTitle");

  return (
    <div className="flex-1 px-4 py-3 overflow-y-auto pt-4">
      <div className="text-fg-dim text-[0.68rem] font-bold uppercase tracking-[0.06em] mb-2.5">
        {title}
      </div>
      {learners.map(learner => {
        const isCurrent = learner.learnerId === currentId;
        const isDefault = learner.learnerId === localDefault;
        return (
          <div
            key={learner.learnerId}
            className={`${CARD_OUTER_CLS} ${isCurrent ? CARD_ACTIVE_CLS : CARD_DEFAULT_CLS}`}
          >
            <button
              type="button"
              className={CARD_BTN_CLS}
              onClick={() => onSelect(learner.learnerId)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`${learner.programType} ${learner.programTitle}, ${learner.group}, ${learner.periodLabel}${isDefault ? `, ${t("defaultBadge")}` : ""}${isCurrent ? ", выбран" : ""}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5" aria-hidden="true">
                <span className="text-[0.65rem] font-bold tracking-[0.04em] bg-line text-fg-muted rounded px-1.5 py-0.5">
                  {learner.programType}
                </span>
                {isDefault && (
                  <span className="text-[0.65rem] font-semibold bg-[color-mix(in_srgb,var(--c-accent)_12%,transparent)] text-accent rounded px-1.5 py-0.5">
                    {t("defaultBadge")}
                  </span>
                )}
                {isCurrent && (
                  <span className="ml-auto text-accent font-bold">✓</span>
                )}
              </div>
              <div className="text-fg text-[0.9rem] font-semibold leading-tight mb-[3px]" aria-hidden="true">
                {learner.programTitle}
              </div>
              <div className="text-fg-muted text-xs" aria-hidden="true">
                {learner.group} · {learner.periodLabel}
              </div>
            </button>
            {!isDefault && (
              <button
                type="button"
                className="block w-full text-left px-4 pb-3 -mt-1 text-accent text-xs cursor-pointer bg-transparent border-0 min-h-[44px]"
                onClick={() => handleSetDefault(learner.learnerId)}
              >
                {t("setAsDefault")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
