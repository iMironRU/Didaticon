/**
 * Card — композитный примитив для карточек/секций.
 *
 * Шесть подкомпонентов как в shadcn/ui:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Личные данные</CardTitle>
 *       <CardDescription>Из Univerkon</CardDescription>
 *     </CardHeader>
 *     <CardContent>...</CardContent>
 *     <CardFooter>actions</CardFooter>
 *   </Card>
 *
 * Card сам по себе — только визуальный контейнер (поверхность + граница + скругление),
 * без отступов. Padding добавляют CardHeader/CardContent/CardFooter — это даёт
 * гибкость (например, картинка во всю ширину карточки без отступов).
 *
 * См. memory: architecture.md → правило 6.
 */
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-surface rounded-lg border border-line", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1 p-4", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-fg text-sm font-semibold", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-fg-muted text-xs", className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-4 pt-0", className)}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-4 pt-0", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";
