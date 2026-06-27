export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth()     === b.getMonth()
    && a.getDate()      === b.getDate();
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day));
  r.setHours(0, 0, 0, 0);
  return r;
}

export function formatDay(d: Date): string {
  return d.toLocaleDateString("ru", { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

// ISO "YYYY-MM-DD" → локализованная дата, напр. "15 янв 2027"
export function formatIsoDate(iso: string, lang = "ru"): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" });
}

// "HH:MM"–"HH:MM" → строка диапазона для расписания
export function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`;
}
