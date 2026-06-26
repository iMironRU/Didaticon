export type ThemeMode = "auto" | "light" | "dark";

const KEY = "eios_theme";

export function getThemeMode(): ThemeMode {
  return (localStorage.getItem(KEY) as ThemeMode) ?? "auto";
}

function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", resolveTheme(mode));
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem(KEY, mode);
  applyTheme(mode);
}

export function cycleTheme(): ThemeMode {
  const order: ThemeMode[] = ["auto", "light", "dark"];
  const current = getThemeMode();
  const next = order[(order.indexOf(current) + 1) % order.length];
  setTheme(next);
  return next;
}

export function initTheme() {
  applyTheme(getThemeMode());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getThemeMode() === "auto") applyTheme("auto");
  });
}
