/**
 * Dialog — обёртка над @radix-ui/react-dialog с темизацией ЭИОС.
 *
 * Использование:
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Открыть</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Подтверждение</DialogTitle>
 *         <DialogDescription>Перенести занятие на следующую неделю?</DialogDescription>
 *       </DialogHeader>
 *       <DialogFooter>
 *         <DialogClose asChild><Button variant="secondary">Отмена</Button></DialogClose>
 *         <Button onClick={confirm}>Перенести</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Что Radix даёт бесплатно: focus trap, Esc close, click-outside close, scroll lock,
 * aria-* атрибуты, portal в body, корректное удаление при размонтировании.
 *
 * Раскладка (issue #7): на мобиле (<768px) — bottom sheet (снизу, во всю
 * ширину, скруглённые верхние углы, drag-хэндл для affordance). На десктопе
 * (≥768px) — прежнее центральное модальное окно. Radix's dismiss-логика
 * (Esc/click-outside/close-кнопка) не меняется — драг-жест dismiss НЕ
 * реализован (не входит в объём issue), только позиционирование+анимация.
 *
 * См. memory: architecture.md → правило 6.
 */
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/utils.js";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Mobile — bottom sheet: прижато к низу, во всю ширину, скруглены
        // только верхние углы, safe-area под iOS home indicator.
        "fixed inset-x-0 bottom-0 z-50 " +
        "w-full max-h-[85vh] overflow-y-auto " +
        "p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] " +
        "bg-surface border border-line rounded-t-2xl shadow-2xl " +
        "animate-sheet-up " +
        "focus:outline-none " +
        // Desktop — прежнее центральное модальное окно, без анимации.
        "md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto " +
        "md:-translate-x-1/2 md:-translate-y-1/2 " +
        "md:w-[calc(100%-2rem)] md:max-w-md md:max-h-[90vh] " +
        "md:rounded-lg md:animate-none",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="md:hidden mx-auto mb-4 -mt-2 h-1 w-10 rounded-full bg-line"
      />
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex justify-end gap-2 mt-6", className)} {...props} />;
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-fg text-lg font-semibold leading-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-fg-muted text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
