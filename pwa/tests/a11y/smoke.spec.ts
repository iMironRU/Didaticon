/**
 * A11y smoke — ключевые экраны через axe-core.
 *
 * Блокирует merge на нарушениях serious / critical (см. политику §4.3:
 * Critical = блокирует категорию пользователей, Major = существенно
 * затрудняет). Minor warnings не блокируют, регистрируются как
 * Accessibility Debt с дедлайнами.
 *
 * Сценарии: загружаем экран, axe-core analyze, проверяем violations.
 * Расширяем по мере появления новых экранов и интерактивных кейсов.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Фильтр axe-нарушений: блокируем merge только на serious/critical. */
function blockingViolations(violations: { impact: string | null | undefined; id: string; nodes: unknown[] }[]) {
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical");
}

/** Базовая конфигурация axe.
 *
 * TODO: правила в `disableRules` — известный Accessibility Debt, закроются
 *   в соответствующих этапах. Каждое — со ссылкой на issue.
 *   - color-contrast       → #29 этап Е (contrast matrix + halation)
 *   - landmark-one-main    → #25 этап Б (семантика, добавить <main>)
 *   - region               → #25 этап Б (все интерактивы внутри landmarks)
 *   - page-has-heading-one → #25 этап Б (h1 на каждом экране)
 */
function axe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // .lesson-type-chip — Minor Accessibility Debt: цветовое кодирование типа
    // занятия. Текст-лейбл рядом дублирует смысл (категория = редундантная
    // визуальная метка). См. docs/accessibility/contrast-matrix.md.
    .exclude(".lesson-type-chip");
  // Все правила включены. Закрыли этапы:
  //   Б (#25) — landmark-one-main, region, page-has-heading-one
  //   Е (#29) — color-contrast (см. docs/accessibility/contrast-matrix.md)
}

test.describe("LoginScreen", () => {
  test("без авторизации — нет нарушений", async ({ page }) => {
    await page.goto("/");
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });
});

test.describe("Demo student", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?demo=student");
    // ждём пока AppShell прорендерится (есть BottomNav)
    await page.waitForSelector('text=Расписание', { timeout: 10_000 });
  });

  test("Schedule (главный экран) — нет нарушений", async ({ page }) => {
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });

  test("Profile — нет нарушений", async ({ page }) => {
    await page.click('text=Профиль');
    await page.waitForSelector('text=Личные данные', { timeout: 5_000 });
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });

  test("Performance — нет нарушений", async ({ page }) => {
    await page.click('text=Дисциплины');
    await page.waitForTimeout(300); // мини-пауза для рендера
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });

  test("Gradebook — нет нарушений", async ({ page }) => {
    await page.click('text=Зачётка');
    await page.waitForTimeout(300);
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });
});

test.describe("Demo teacher", () => {
  test("Schedule — нет нарушений", async ({ page }) => {
    await page.goto("/?demo=teacher");
    await page.waitForSelector('text=Расписание', { timeout: 10_000 });
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });

  test("Profile — нет нарушений", async ({ page }) => {
    await page.goto("/?demo=teacher");
    await page.waitForSelector('text=Расписание', { timeout: 10_000 });
    await page.click('text=Профиль');
    await page.waitForSelector('text=Личные данные', { timeout: 5_000 });
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });
});

test.describe("Admin", () => {
  test("/admin — нет нарушений", async ({ page }) => {
    await page.goto("/admin");
    // admin защищён токеном, страница входа — обычная форма
    await page.waitForTimeout(500);
    const { violations } = await axe(page).analyze();
    expect(blockingViolations(violations)).toEqual([]);
  });
});
