/**
 * cn() — единственный helper для UI-кита. Объединяет className-ы и
 * правильно мержит конфликтующие Tailwind-классы (последний выигрывает).
 *
 * Без него:  cn("px-2 px-4")  →  "px-2 px-4"  (оба применяются, последний в каскаде)
 * С ним:     cn("px-2 px-4")  →  "px-4"      (tailwind-merge удаляет конфликт)
 *
 * Использовать в КАЖДОМ компоненте src/ui/, который принимает className извне.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
