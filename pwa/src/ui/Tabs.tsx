/**
 * Tabs — обёртка над @radix-ui/react-tabs.
 *
 * Использование:
 *   <Tabs defaultValue="status">
 *     <TabsList>
 *       <TabsTrigger value="status">Статус</TabsTrigger>
 *       <TabsTrigger value="config">Конфиг</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="status">...</TabsContent>
 *     <TabsContent value="config">...</TabsContent>
 *   </Tabs>
 *
 * Radix даёт: keyboard navigation (стрелки между табами), aria-роли
 * (tablist/tab/tabpanel), focus management, controlled/uncontrolled mode.
 *
 * См. memory: architecture.md → правило 6.
 */
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/utils.js";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-start gap-1 " +
      "border-b border-line " +
      "overflow-x-auto",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "px-4 py-3 text-sm font-medium whitespace-nowrap shrink-0 " +
      "bg-transparent border-0 cursor-pointer " +
      "text-fg-muted hover:text-fg " +
      "border-b-2 border-transparent -mb-px " +
      "transition-colors " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset " +
      "data-[state=active]:text-accent data-[state=active]:border-accent " +
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
