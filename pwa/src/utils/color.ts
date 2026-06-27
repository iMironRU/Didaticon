import type { CSSProperties } from "react";
import type { FinalControlType } from "@eios/contracts";

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function fcChipStyle(type: FinalControlType): CSSProperties {
  if (type === "экзамен" || type === "ЭК")
    return { background: "color-mix(in srgb, #7C5CBF 18%, transparent)", color: "#a97de8" };
  if (type === "дифзачёт")
    return { background: "color-mix(in srgb, var(--c-accent) 15%, transparent)", color: "var(--c-accent)" };
  // зачёт, курсовая
  return { background: "color-mix(in srgb, var(--c-success) 15%, transparent)", color: "var(--c-success)" };
}
