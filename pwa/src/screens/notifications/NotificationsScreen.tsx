import type { CSSProperties } from "react";
import type { Notification, NotificationCategory } from "@eios/contracts";
import { formatIsoDate } from "../../utils/date.js";
import { useLocale } from "../../locale.js";

interface Props {
  notifications: Notification[];
  onBack:        () => void;
  onOpen:        (n: Notification) => void;
  onRead:        (id: string) => void;
  onReadAll:     () => void;
}

const CATEGORY_COLOR: Record<NotificationCategory, string> = {
  lesson_available:  "var(--c-accent)",
  grade_posted:      "var(--c-success)",
  retake_scheduled:  "var(--c-danger)",
  booking_confirmed: "var(--c-success)",
  debt_deadline:     "var(--c-danger)",
  announcement:      "var(--c-text-secondary)",
  system:            "var(--c-purple, #7C5CBF)",
};

// ── NotificationsScreen ───────────────────────────────────────────────────────
export function NotificationsScreen({ notifications, onBack, onOpen, onRead, onReadAll }: Props) {
  const { t } = useLocale();
  const CATEGORY_LABEL: Record<NotificationCategory, string> = {
    lesson_available:  t("notifLesson"),
    grade_posted:      t("notifGrade"),
    retake_scheduled:  t("notifRetake"),
    booking_confirmed: t("notifBooking"),
    debt_deadline:     t("notifDebt"),
    announcement:      t("notifAnnouncement"),
    system:            t("notifSystem"),
  };
  const hasUnread = notifications.some(n => !n.read);

  return (
    <>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> {t("back")}
        </button>
        <div style={st.subHeaderTitle}>{t("notifications")}</div>
        {hasUnread && (
          <button style={st.readAllBtn} onClick={onReadAll}>{t("readAll")}</button>
        )}
      </div>

      <div style={{ ...st.body, paddingTop: 16 }}>
        {notifications.length === 0 ? (
          <div style={st.empty}>{t("noNotifications")}</div>
        ) : (
          notifications.map(n => {
            const hasDetail = !!n.fullText;
            return (
              <div
                key={n.notificationId}
                style={{ ...st.card, opacity: n.read ? 0.6 : 1, cursor: hasDetail ? "pointer" : "default" }}
                onClick={() => hasDetail ? onOpen(n) : onRead(n.notificationId)}
              >
                <div style={st.cardHead}>
                  <span style={{ ...st.catLabel, color: CATEGORY_COLOR[n.category] }}>
                    {CATEGORY_LABEL[n.category]}
                  </span>
                  <span style={st.cardDate}>{formatIsoDate(n.createdAt.slice(0, 10))}</span>
                  {!n.read && <span style={st.dot} />}
                </div>
                <div style={st.cardRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={st.cardTitle}>{n.title}</div>
                    <div style={st.cardBody}>{n.body}</div>
                    {n.deepLink && !hasDetail && (
                      <div style={st.deepLink}>{t("deepLink")}</div>
                    )}
                  </div>
                  {hasDetail && <span style={st.chevron}>›</span>}
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
  const { t } = useLocale();
  const CATEGORY_LABEL: Record<NotificationCategory, string> = {
    lesson_available:  t("notifLesson"),
    grade_posted:      t("notifGrade"),
    retake_scheduled:  t("notifRetake"),
    booking_confirmed: t("notifBooking"),
    debt_deadline:     t("notifDebt"),
    announcement:      t("notifAnnouncement"),
    system:            t("notifSystem"),
  };
  return (
    <>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> {t("back")}
        </button>
        <div style={st.subHeaderTitle}>{n.title}</div>
      </div>

      <div style={{ ...st.body, paddingTop: 20, flex: 1 }}>
        <div style={st.detailMeta}>
          <span style={{ ...st.catLabel, color: CATEGORY_COLOR[n.category] }}>
            {CATEGORY_LABEL[n.category]}
          </span>
          <span style={st.cardDate}>{formatIsoDate(n.createdAt.slice(0, 10))}</span>
        </div>
        <h2 style={st.detailTitle}>{n.title}</h2>
        <p style={st.detailText}>{n.fullText ?? n.body}</p>
        {n.links && n.links.length > 0 && (
          <div style={st.links}>
            {n.links.map((lnk, i) => (
              <a key={i} href={lnk.url} style={st.link} target="_blank" rel="noopener noreferrer">
                {lnk.label} →
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  subHeader:   { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  backBtn:     { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  subHeaderTitle: { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  readAllBtn:  { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.75rem", cursor: "pointer", padding: "2px 0", fontWeight: 500, flexShrink: 0 },
  body:        { flex: 1, padding: "12px 16px", overflowY: "auto" },
  empty:       { color: "var(--c-text-dim)", textAlign: "center" as const, padding: "32px 0", fontSize: "0.85rem" },
  card:        { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px", marginBottom: 8 },
  cardHead:    { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  catLabel:    { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em" },
  cardDate:    { color: "var(--c-text-dim)", fontSize: "0.65rem", flex: 1 },
  dot:         { width: 6, height: 6, borderRadius: "50%", background: "var(--c-accent)", flexShrink: 0 },
  cardRow:     { display: "flex", alignItems: "flex-start", gap: 8 },
  cardTitle:   { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 500, marginBottom: 4 },
  cardBody:    { color: "var(--c-text-muted)", fontSize: "0.78rem", lineHeight: 1.5 },
  deepLink:    { color: "var(--c-accent)", fontSize: "0.72rem", marginTop: 6, fontWeight: 500 },
  chevron:     { color: "var(--c-text-dim)", fontSize: "1.2rem", lineHeight: 1.5, flexShrink: 0 },
  detailMeta:  { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  detailTitle: { color: "var(--c-text-primary)", fontSize: "1rem", fontWeight: 600, margin: "0 0 16px", lineHeight: 1.4 },
  detailText:  { color: "var(--c-text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 24px", whiteSpace: "pre-wrap" as const },
  links:       { display: "flex", flexDirection: "column" as const, gap: 10 },
  link:        { display: "block", color: "var(--c-accent)", fontSize: "0.88rem", fontWeight: 500, padding: "12px 16px", background: "var(--c-card)", border: "0.5px solid var(--c-border)", borderRadius: 10, textDecoration: "none" },
};
