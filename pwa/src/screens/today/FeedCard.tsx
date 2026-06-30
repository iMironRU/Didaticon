/**
 * FeedCard — карточка дашборда «Сегодня» (Block II §5–7).
 * Рендерит шапку + kind-специфичный блок деталей.
 * Неизвестный kind → generic fallback по шапке.
 */
import type {
  FeedCard as FeedCardType,
  EventCard, FormDeadlineCard, EventDebtCard,
  AcademicDebtCard, DeliveryRequiredCard, ActiveAttemptCard,
  ExternalActionCard,
} from "../../api/feed.js";

// ── Форматирование времени ────────────────────────────────────────────────────

function formatDueAt(dueAt: string | null): string {
  if (!dueAt) return "";
  const diff = new Date(dueAt).getTime() - Date.now();
  const min  = Math.round(diff / 60_000);
  if (min < 0)   return "просрочено";
  if (min < 60)  return `через ${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `через ${h} ч`;
  const d = Math.floor(h / 24);
  return `через ${d} дн`;
}

// ── Цвета по kind ─────────────────────────────────────────────────────────────

function kindMeta(kind: string): { label: string; border: string; badge: string } {
  switch (kind) {
    case "event":              return { label: "Занятие",       border: "border-l-[var(--c-accent)]",   badge: "bg-accent/10 text-accent" };
    case "form_deadline":      return { label: "Срок сдачи",    border: "border-l-amber-400",            badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
    case "event_debt":         return { label: "Пропуск",       border: "border-l-rose-400",             badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" };
    case "academic_debt":      return { label: "Задолженность", border: "border-l-red-500",              badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
    case "delivery_required":  return { label: "Сдать работу",  border: "border-l-violet-400",           badge: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" };
    case "active_attempt":     return { label: "Идёт попытка!", border: "border-l-red-500",              badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" };
    case "external_action":    return { label: "Действие",      border: "border-l-orange-500",           badge: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" };
    // teacher kinds
    case "submissions_to_grade":   return { label: "На проверке",   border: "border-l-sky-400", badge: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" };
    case "teacher_event_debt":     return { label: "Методический долг", border: "border-l-rose-400", badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" };
    case "module_close_required":  return { label: "Завершить модуль", border: "border-l-amber-400", badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
    default:                   return { label: kind,             border: "border-l-fg-dim",               badge: "bg-surface text-fg-muted" };
  }
}

// ── kind-специфичные детали ───────────────────────────────────────────────────

function EventDetails({ card }: { card: EventCard }) {
  const d = card.details;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
      {d.room && <span className="text-xs text-fg-muted">📍 {d.room}</span>}
      {d.format === "online" && d.meeting_url && <span className="text-xs text-accent">🔗 Онлайн</span>}
      {d.has_pre_event_bonus && <span className="text-xs text-emerald-600 dark:text-emerald-400">✦ Бонус за ранний старт</span>}
      {d.related_debts.count > 0 && (
        <span className="text-xs text-rose-500">{d.related_debts.count} долг{d.related_debts.count > 1 ? "а" : ""}</span>
      )}
    </div>
  );
}

function FormDeadlineDetails({ card }: { card: FormDeadlineCard }) {
  const d = card.details;
  const label = d.form_kind === "control_work" ? "Контрольная"
    : d.form_kind === "test" ? "Тест"
    : d.form_kind === "essay" ? "Эссе"
    : d.form_kind;
  return <span className="text-xs text-fg-muted mt-1">{label} · {d.discipline_title}</span>;
}

function EventDebtDetails({ card }: { card: EventDebtCard }) {
  const d = card.details;
  return (
    <div className="flex gap-2 mt-1">
      {d.recovery_options.offline.available && (
        <span className="text-xs text-fg-muted">Отработка: {d.recovery_options.offline.slots_count ?? ""} слот(ов)</span>
      )}
      {!d.recovery_options.offline.available && !d.recovery_options.online.available && (
        <span className="text-xs text-rose-500">Отработка недоступна</span>
      )}
    </div>
  );
}

function AcademicDebtDetails({ card }: { card: AcademicDebtCard }) {
  const d = card.details;
  const label = d.debt_kind === "retake" ? "Пересдача" : d.debt_kind === "commission" ? "Комиссия" : "Открыт";
  return <span className="text-xs text-fg-muted mt-1">{label} · {d.discipline_title}</span>;
}

function DeliveryDetails({ card }: { card: DeliveryRequiredCard }) {
  const d = card.details;
  return d.delivery_point
    ? <span className="text-xs text-fg-muted mt-1">📍 {d.delivery_point}</span>
    : null;
}

function ActiveAttemptDetails({ card }: { card: ActiveAttemptCard }) {
  const d = card.details;
  const urgent = d.remaining_minutes < 15;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-xs font-semibold ${urgent ? "text-red-600 dark:text-red-400" : "text-fg-secondary"}`}>
        ⏱ {d.remaining_minutes} мин осталось
      </span>
      <span className="text-xs text-fg-muted">{d.discipline_title}</span>
    </div>
  );
}

function ExternalDetails({ card }: { card: ExternalActionCard }) {
  return <span className="text-xs text-fg-muted mt-1">Внешнее действие · {card.details.source_system}</span>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function FeedCardSkeleton() {
  return (
    <div className="bg-elevated rounded-xl border border-line border-l-4 border-l-line p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-16 bg-line rounded" />
        <div className="h-4 w-24 bg-line rounded" />
      </div>
      <div className="h-5 w-3/4 bg-line rounded mb-1" />
      <div className="h-4 w-1/2 bg-line rounded" />
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

interface Props {
  card:    FeedCardType;
  onTap?:  (card: FeedCardType) => void;
}

export function FeedCard({ card, onTap }: Props) {
  const meta = kindMeta(card.kind);
  const dueLabel = formatDueAt(card.due_at);
  const isUrgent = card.urgency >= 85;

  return (
    <button
      className={`w-full text-left bg-elevated rounded-xl border border-line border-l-4 ${meta.border} p-4 cursor-pointer hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      onClick={() => onTap?.(card)}
      aria-label={`${card.title}. ${card.subtitle}`}
    >
      {/* Шапка: badge + время */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[0.65rem] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${meta.badge}`}>
          {meta.label}
        </span>
        {dueLabel && (
          <span className={`text-xs font-medium ${isUrgent ? "text-rose-500 dark:text-rose-400" : "text-fg-muted"}`}>
            {dueLabel}
          </span>
        )}
      </div>

      {/* Заголовок */}
      <div className={`text-sm font-semibold text-fg leading-tight ${card.kind === "active_attempt" ? "text-rose-700 dark:text-rose-300" : ""}`}>
        {card.title}
      </div>

      {/* Subtitle */}
      <div className="text-xs text-fg-muted mt-0.5 leading-snug">{card.subtitle}</div>

      {/* Kind-специфичные детали */}
      {card.kind === "event"             && <EventDetails card={card as EventCard} />}
      {card.kind === "form_deadline"     && <FormDeadlineDetails card={card as FormDeadlineCard} />}
      {card.kind === "event_debt"        && <EventDebtDetails card={card as EventDebtCard} />}
      {card.kind === "academic_debt"     && <AcademicDebtDetails card={card as AcademicDebtCard} />}
      {card.kind === "delivery_required" && <DeliveryDetails card={card as DeliveryRequiredCard} />}
      {card.kind === "active_attempt"    && <ActiveAttemptDetails card={card as ActiveAttemptCard} />}
      {card.kind === "external_action"   && <ExternalDetails card={card as ExternalActionCard} />}
    </button>
  );
}
