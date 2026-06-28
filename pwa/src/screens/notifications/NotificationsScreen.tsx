import type { Notification, NotificationCategory } from "@eios/contracts";
import { formatIsoDate } from "../../utils/date.js";
import { useLocale } from "../../locale.js";
import { SubHeader } from "../../shell/SubHeader.js";

interface Props {
  notifications: Notification[];
  onBack:        () => void;
  onOpen:        (n: Notification) => void;
  onRead:        (id: string) => void;
  onReadAll:     () => void;
}

/**
 * Цвета категорий — inline через style, потому что Tailwind не может
 * генерировать классы из переменных в рантайме. Категорий 7, добавлять
 * перебор `text-accent`/`text-success`/`text-danger`/`text-purple`/...
 * не сильно проще.
 */
const CATEGORY_COLOR: Record<NotificationCategory, string> = {
  lesson_available:  "var(--c-accent)",
  grade_posted:      "var(--c-success)",
  retake_scheduled:  "var(--c-danger)",
  booking_confirmed: "var(--c-success)",
  debt_deadline:     "var(--c-danger)",
  announcement:      "var(--c-text-secondary)",
  system:            "var(--c-purple)",
};

function useCategoryLabels(): Record<NotificationCategory, string> {
  const { t } = useLocale();
  return {
    lesson_available:  t("notifLesson"),
    grade_posted:      t("notifGrade"),
    retake_scheduled:  t("notifRetake"),
    booking_confirmed: t("notifBooking"),
    debt_deadline:     t("notifDebt"),
    announcement:      t("notifAnnouncement"),
    system:            t("notifSystem"),
  };
}

// ── Список уведомлений ───────────────────────────────────────────────────────
export function NotificationsScreen({ notifications, onBack, onOpen, onRead, onReadAll }: Props) {
  const { t } = useLocale();
  const labels    = useCategoryLabels();
  const hasUnread = notifications.some(n => !n.read);

  return (
    <>
      <SubHeader
        title={t("notifications")}
        onBack={onBack}
        action={hasUnread && (
          <button
            className="bg-transparent border-0 text-accent text-[0.75rem] font-medium cursor-pointer shrink-0"
            onClick={onReadAll}
          >
            {t("readAll")}
          </button>
        )}
      />

      <div className="flex-1 px-4 py-3 overflow-y-auto pt-4">
        {notifications.length === 0 ? (
          <div className="text-fg-dim text-center py-8 text-[0.85rem]">{t("noNotifications")}</div>
        ) : (
          notifications.map(n => {
            const hasDetail = !!n.fullText;
            return (
              <div
                key={n.notificationId}
                className="bg-surface rounded-lg border border-line px-3.5 py-3 mb-2"
                style={{ opacity: n.read ? 0.6 : 1, cursor: hasDetail ? "pointer" : "default" }}
                onClick={() => hasDetail ? onOpen(n) : onRead(n.notificationId)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[0.65rem] font-bold tracking-[0.04em]"
                    style={{ color: CATEGORY_COLOR[n.category] }}
                  >
                    {labels[n.category]}
                  </span>
                  <span className="text-fg-dim text-[0.65rem] flex-1">
                    {formatIsoDate(n.createdAt.slice(0, 10))}
                  </span>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-fg text-[0.85rem] font-medium mb-1">{n.title}</div>
                    <div className="text-fg-muted text-[0.78rem] leading-normal">{n.body}</div>
                    {n.deepLink && !hasDetail && (
                      <div className="text-accent text-[0.72rem] mt-1.5 font-medium">{t("deepLink")}</div>
                    )}
                  </div>
                  {hasDetail && <span className="text-fg-dim text-xl leading-snug shrink-0">›</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ── Детальный экран уведомления ───────────────────────────────────────────────
interface DetailProps {
  notification: Notification;
  onBack:       () => void;
}

export function NotificationDetailScreen({ notification: n, onBack }: DetailProps) {
  const labels = useCategoryLabels();
  return (
    <>
      <SubHeader title={n.title} onBack={onBack} />

      <div className="flex-1 px-4 py-5 overflow-y-auto">
        <div className="flex items-center gap-2.5 mb-2.5">
          <span
            className="text-[0.65rem] font-bold tracking-[0.04em]"
            style={{ color: CATEGORY_COLOR[n.category] }}
          >
            {labels[n.category]}
          </span>
          <span className="text-fg-dim text-[0.65rem]">
            {formatIsoDate(n.createdAt.slice(0, 10))}
          </span>
        </div>
        <h2 className="text-fg text-base font-semibold mb-4 leading-snug">{n.title}</h2>
        <p className="text-fg-secondary text-[0.9rem] leading-relaxed mb-6 whitespace-pre-wrap">
          {n.fullText ?? n.body}
        </p>
        {n.links && n.links.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {n.links.map((lnk, i) => (
              <a
                key={i}
                href={lnk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-accent text-[0.88rem] font-medium px-4 py-3 bg-surface border border-line rounded-lg no-underline"
              >
                {lnk.label} →
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
