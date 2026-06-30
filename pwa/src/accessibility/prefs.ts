/**
 * Accessibility preferences — единое локальное хранилище 6 настроек физлица
 * (политика §7.1 + didakticon-accessibility.md §7.1).
 *
 * Сейчас localStorage, после интеграции с Univerkon — синхронизация в боевом
 * контуре. Это саморепортируемые предпочтения интерфейса, **НЕ медицинские
 * данные** (политика §8.2).
 *
 * Применение:
 *  - font_size:        --font-size-base через `fontSize.ts` (ранее)
 *  - high_contrast:    data-contrast="high" → CSS усиления контраста и границ
 *  - reduced_motion:   data-motion="reduce" → отключение transitions/animations
 *  - dyslexia_friendly: data-dyslexia="true" → letter/word-spacing
 *  - screen_reader:    флаг для UX-решений (aria-live ассертивнее)
 *  - extended_test_time: флаг, пробрасывается в Тестикон (когда появится)
 */
export interface AccessibilityPrefs {
  font_size:          "small" | "normal" | "large";
  high_contrast:      boolean;
  reduced_motion:     boolean;
  dyslexia_friendly:  boolean;
  screen_reader:      boolean;
  extended_test_time: boolean;
}

const DEFAULTS: AccessibilityPrefs = {
  font_size:          "normal",
  high_contrast:      false,
  reduced_motion:     false,
  dyslexia_friendly:  false,
  screen_reader:      false,
  extended_test_time: false,
};

// Ключи в localStorage (каждое поле отдельно — позже легко мигрировать в Univerkon)
const KEYS = {
  font_size:          "eios_font_size",       // существует с этапа Е (S/M/L)
  high_contrast:      "eios_a11y_contrast",
  reduced_motion:     "eios_a11y_motion",
  dyslexia_friendly:  "eios_a11y_dyslexia",
  screen_reader:      "eios_a11y_sr",
  extended_test_time: "eios_a11y_xtime",
} as const;

function readBool(key: string): boolean {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
function writeBool(key: string, v: boolean): void {
  try { localStorage.setItem(key, v ? "1" : "0"); } catch { /* */ }
}
function readFontSize(): AccessibilityPrefs["font_size"] {
  try {
    const v = localStorage.getItem(KEYS.font_size);
    if (v === "s" || v === "small")  return "small";
    if (v === "l" || v === "large")  return "large";
    return "normal";
  } catch { return "normal"; }
}

export function getPrefs(): AccessibilityPrefs {
  return {
    font_size:          readFontSize(),
    high_contrast:      readBool(KEYS.high_contrast),
    reduced_motion:     readBool(KEYS.reduced_motion),
    dyslexia_friendly:  readBool(KEYS.dyslexia_friendly),
    screen_reader:      readBool(KEYS.screen_reader),
    extended_test_time: readBool(KEYS.extended_test_time),
  };
}

export function setHighContrast(v: boolean): void {
  writeBool(KEYS.high_contrast, v);
  document.documentElement.dataset.contrast = v ? "high" : "";
}
export function setReducedMotion(v: boolean): void {
  writeBool(KEYS.reduced_motion, v);
  document.documentElement.dataset.motion = v ? "reduce" : "";
}
export function setDyslexiaFriendly(v: boolean): void {
  writeBool(KEYS.dyslexia_friendly, v);
  document.documentElement.dataset.dyslexia = v ? "true" : "";
}
export function setScreenReader(v: boolean): void {
  writeBool(KEYS.screen_reader, v);
}
export function setExtendedTestTime(v: boolean): void {
  writeBool(KEYS.extended_test_time, v);
}

/** Применить все настройки к DOM на старте PWA. */
export function applyPrefs(): void {
  const p = getPrefs();
  document.documentElement.dataset.contrast = p.high_contrast    ? "high"   : "";
  document.documentElement.dataset.motion   = p.reduced_motion   ? "reduce" : "";
  document.documentElement.dataset.dyslexia = p.dyslexia_friendly ? "true"  : "";
}

// Re-export DEFAULTS для тестов / документации
export { DEFAULTS };
