/**
 * Toast — обёртка над @radix-ui/react-toast + imperative API через useToast().
 *
 * Использование:
 *   // 1. Один раз обернуть приложение:
 *   <ToastQueue>
 *     <App />
 *   </ToastQueue>
 *
 *   // 2. В любом компоненте:
 *   const { toast } = useToast();
 *   toast({ title: "Сохранено" });
 *   toast({ title: "Ошибка", description: "Сервер недоступен", variant: "danger" });
 *
 * Radix даёт: aria-live, swipe-dismiss, focus management, hover-pause,
 * keyboard accessible (F8 для фокуса на ToastViewport).
 *
 * См. memory: architecture.md → правило 6.
 */
import {
  createContext, useCallback, useContext, useState,
  forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode,
} from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils.js";

// ── Стилизованные примитивы ───────────────────────────────────────────────────

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start justify-between gap-3 " +
  "rounded-lg border p-4 pr-8 shadow-lg " +
  "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] " +
  "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform " +
  "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[state=closed]:opacity-0 " +
  "transition-opacity",
  {
    variants: {
      variant: {
        default: "bg-surface border-line text-fg",
        success: "bg-surface border-success text-fg",
        danger:  "bg-surface border-danger  text-fg",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export const Toast = forwardRef<
  ElementRef<typeof ToastPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = "Toast";

export const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-xs text-fg-muted mt-1", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="Закрыть"
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-fg-muted opacity-60 " +
      "hover:opacity-100 hover:bg-elevated " +
      "focus:outline-none focus:ring-2 focus:ring-accent",
      className,
    )}
    {...props}
  >
    ✕
  </ToastPrimitive.Close>
));
ToastClose.displayName = "ToastClose";

const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-100 flex max-h-screen w-full md:max-w-md " +
      "flex-col-reverse gap-2 p-4 outline-none",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

// ── Очередь + хук ─────────────────────────────────────────────────────────────

interface ToastItem {
  id:           string;
  title:        string;
  description?: string;
  variant?:     "default" | "success" | "danger";
}

interface ToastApi {
  toast:   (opts: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastQueueContext = createContext<ToastApi | null>(null);

export function ToastQueue({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7);
    setItems((prev) => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastQueueContext.Provider value={{ toast, dismiss }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            onOpenChange={(open) => { if (!open) dismiss(t.id); }}
          >
            <div className="flex-1 min-w-0">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastPrimitive.Provider>
    </ToastQueueContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastQueueContext);
  if (!ctx) throw new Error("useToast must be used within <ToastQueue>");
  return ctx;
}
