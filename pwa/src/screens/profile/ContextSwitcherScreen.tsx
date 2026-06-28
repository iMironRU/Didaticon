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

const CARD_BASE_CLS =
  "border border-line rounded-xl px-4 py-3.5 mb-2.5 cursor-pointer";
const CARD_ACTIVE_CLS =
  "border-accent bg-[color-mix(in_srgb,var(--c-accent)_6%,var(--c-card))]";
const CARD_DEFAULT_CLS = "bg-surface";

export function ContextSwitcherScreen({
  person, learners, currentId, defaultId, onSelect, onSetDefault,
}: Props) {
  const { t } = useLocale();
  const [localDefault, setLocalDefault] = useState(defaultId);

  function handleSetDefault(id: string, e: React.MouseEvent) {
    e.stopPropagation();
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
            className={`${CARD_BASE_CLS} ${isCurrent ? CARD_ACTIVE_CLS : CARD_DEFAULT_CLS}`}
            onClick={() => onSelect(learner.learnerId)}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
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
            <div className="text-fg text-[0.9rem] font-semibold leading-tight mb-[3px]">
              {learner.programTitle}
            </div>
            <div className="text-fg-muted text-xs">
              {learner.group} · {learner.periodLabel}
            </div>
            <button
              className={`border-0 bg-transparent text-accent text-xs cursor-pointer mt-2 p-0 ${isDefault ? "invisible" : ""}`}
              onClick={e => handleSetDefault(learner.learnerId, e)}
            >
              {t("setAsDefault")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
