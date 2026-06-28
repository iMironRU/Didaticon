/**
 * TeacherSlotCard — карточка слота для педагога.
 *
 * Содержит: время, дисциплина с типом-бейджем, аудитория, ГРУППЫ, действия:
 * "Отказаться" → диалог с причиной (через `<Dialog>` UI-кит).
 *
 * Отказ — пока локальный state (мок). Когда появится реальный API,
 * подключится к data/source.
 */
import { useState } from "react";
import type { TeacherScheduleSlot, RefuseReason } from "@eios/contracts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "../../ui/Dialog.js";
import { Button } from "../../ui/Button.js";

const REFUSE_LABELS: Record<RefuseReason, string> = {
  illness:       "Болезнь",
  business_trip: "Командировка",
  other:         "Другое",
};

interface Props {
  slot:   TeacherScheduleSlot;
  date:   string;
  onOpen: () => void;
}

export function TeacherSlotCard({ slot, onOpen }: Props) {
  const [refused, setRefused] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RefuseReason | null>(null);

  const groupStr = slot.groups.map(g => `${g.title} (${g.count})`).join(", ");

  function confirm() {
    if (!reason) return;
    setRefused(true);
    setOpen(false);
    setReason(null);
  }

  return (
    <>
      <div
        className="bg-surface rounded-xl px-3.5 py-3 flex gap-3 items-start cursor-pointer mb-2"
        style={{ opacity: refused ? 0.5 : 1, cursor: refused ? "default" : "pointer" }}
        onClick={() => !refused && onOpen()}
      >
        <div className="text-fg-muted text-[0.75rem] min-w-[72px] pt-0.5">
          {slot.timeStart}–{slot.timeEnd}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-fg text-[0.92rem] font-semibold mb-1">{slot.unitRef.title}</div>
          <div className="flex gap-1 items-center mb-[3px]">
            <span className="text-[0.68rem] bg-track rounded px-1.5 py-px text-accent">{slot.lessonKind}</span>
            {slot.room && <span className="text-[0.75rem] text-fg-muted">· {slot.room}</span>}
          </div>
          <div className="text-[0.78rem] text-fg-muted">{groupStr}</div>
          {refused && <div className="text-[0.72rem] text-danger mt-1">Отказ подан</div>}
        </div>
        {!refused && slot.canRefuse && (
          <button
            className="shrink-0 bg-transparent border border-danger rounded-lg text-danger text-[0.72rem] px-2.5 py-1.5 cursor-pointer self-center"
            onClick={e => { e.stopPropagation(); setOpen(true); setReason(null); }}
          >
            Отказаться
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Причина отказа</DialogTitle>
            <DialogDescription>{slot.unitRef.title} · {slot.timeStart}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {(Object.entries(REFUSE_LABELS) as [RefuseReason, string][]).map(([key, label]) => (
              <button
                key={key}
                className={
                  "border rounded-xl px-3.5 py-3 text-[0.9rem] text-left cursor-pointer transition-colors " +
                  (reason === key
                    ? "border-[1.5px] border-accent text-accent bg-surface"
                    : "border-line text-fg bg-surface")
                }
                onClick={() => setReason(key)}
              >
                {reason === key ? "● " : "○ "}{label}
              </button>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Отмена</Button>
            </DialogClose>
            <Button variant="danger" onClick={confirm} disabled={!reason}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
