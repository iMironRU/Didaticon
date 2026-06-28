/**
 * Confirm — drop-in замена для browser confirm().
 *
 * Использование:
 *   const { confirm } = useConfirm();
 *   if (await confirm({ title: "Удалить файл?", variant: "danger" })) {
 *     // delete
 *   }
 *
 * Требует <ConfirmProvider> в дереве (обычно один раз рядом с ToastQueue).
 * Под капотом — Promise + наш Dialog из UI-кита (focus trap, Esc, click-outside).
 *
 * См. memory: architecture.md → правило 6.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "./Dialog.js";
import { Button } from "./Button.js";

export interface ConfirmOptions {
  title:         string;
  description?:  string;
  confirmLabel?: string;        // default "Подтвердить"
  cancelLabel?:  string;        // default "Отмена"
  variant?:      "default" | "danger";   // danger → красная кнопка (для деструктивных операций)
}

interface ConfirmApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmApi | null>(null);

interface PendingState {
  opts:    ConfirmOptions;
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ opts, resolve });
    });
  }, []);

  function handle(value: boolean) {
    if (!pending) return;
    pending.resolve(value);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={!!pending} onOpenChange={(open) => { if (!open) handle(false); }}>
        <DialogContent>
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{pending.opts.title}</DialogTitle>
                {pending.opts.description && (
                  <DialogDescription>{pending.opts.description}</DialogDescription>
                )}
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary" onClick={() => handle(false)}>
                  {pending.opts.cancelLabel ?? "Отмена"}
                </Button>
                <Button
                  variant={pending.opts.variant === "danger" ? "danger" : "primary"}
                  onClick={() => handle(true)}
                  autoFocus
                >
                  {pending.opts.confirmLabel ?? "Подтвердить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}
