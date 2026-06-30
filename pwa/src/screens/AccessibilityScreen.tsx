/**
 * AccessibilityScreen — публичная декларация доступности по стандартизованному
 * URL `/accessibility` (политика §7.5, didakticon-accessibility.md §2.3).
 *
 * Формальная точка проверки аккредитационной комиссией. Доступна без
 * авторизации, deep-linkable.
 *
 * Содержание:
 *  - Уровень соответствия (AA)
 *  - Перечень закрытых разделов
 *  - Известные ограничения (Accessibility Debt)
 *  - **«Почему отсутствует отдельная версия для слабовидящих»** — §2.4.1
 *    защита от инерции ГОСТ Р 52872-2012
 *  - Контакты обратной связи
 *  - Даты оценки и переоценки
 */
import type { Branding } from "../config.js";
import { Button } from "../ui/Button.js";
import { useDocumentTitle } from "../useDocumentTitle.js";

interface Props {
  branding: Branding;
}

const LAST_ASSESSMENT = "30 июня 2026";
const NEXT_ASSESSMENT = "30 декабря 2026";  // плановая полугодовая ревизия
const FEEDBACK_EMAIL_DEFAULT = "accessibility@didacticon.test";

export function AccessibilityScreen({ branding }: Props) {
  useDocumentTitle("Декларация доступности");
  const supportEmail = branding.supportEmail || FEEDBACK_EMAIL_DEFAULT;

  function back() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }

  return (
    <div className="min-h-[100dvh] bg-canvas text-fg overflow-y-auto">
      <header className="sticky top-0 z-10 bg-elevated border-b border-line px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={back} aria-label="Назад">
          ‹ <span>Назад</span>
        </Button>
        <span className="text-sm font-semibold">Доступность</span>
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-fg text-xl font-bold mb-1">Декларация доступности</h1>
        <p className="text-fg-muted text-sm mb-6">
          {branding.orgName} · Дидактикон
        </p>

        <section className="mb-6">
          <h2 className="text-fg text-base font-semibold mb-2">Уровень соответствия</h2>
          <p className="text-fg-secondary text-sm leading-relaxed">
            Дидактикон соответствует уровню <strong>AA</strong> по{" "}
            <strong>ГОСТ Р 52872-2019</strong> (российская адаптация WCAG 2.1).
            Дополнительно выполняются критерии WCAG 2.2 уровня AA{" "}
            <em>Focus Not Obscured</em> и <em>Accessible Authentication</em>,
            а также критерий AAA <em>Target Size 44×44</em> как более строгая
            версия требования к размеру тап-цели.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-fg text-base font-semibold mb-2">
            Почему отсутствует отдельная версия для слабовидящих
          </h2>
          <p className="text-fg-secondary text-sm leading-relaxed mb-3">
            Дидактикон <strong>принципиально не реализует</strong> «версию для
            слабовидящих» как отдельный интерфейс. Доступность обеспечивается
            единой кодовой базой, соответствующей действующему ГОСТ Р 52872-2019.
          </p>
          <p className="text-fg-secondary text-sm leading-relaxed mb-3">
            Действующая редакция ГОСТ <strong>не требует</strong> отдельной
            версии для слабовидящих — она формулирует требования к доступности
            <em>самого интерфейса</em> на уровне AA. Подход опирается на WCAG и
            согласован с международной инклюзивной практикой.
          </p>
          <p className="text-fg-secondary text-sm leading-relaxed mb-3">
            Предыдущая редакция ГОСТ Р 52872-<strong>2012</strong> на практике
            трактовалась как требование размещать «версию для слабовидящих» —
            ровно тот сегрегированный антипаттерн, который настоящий стандарт
            отвергает. Сегрегированные интерфейсы хуже основного по
            функциональности (их меньше тестируют, медленнее обновляют) и
            конфликтуют с инклюзивной образовательной политикой ФЗ-273.
          </p>
          <p className="text-fg-secondary text-sm leading-relaxed">
            Один корректно спроектированный интерфейс <strong>технически проще,
            функционально полнее и юридически корректнее</strong>, чем
            «обычный + альтернативный». Соответствие AA обеспечивает доступность
            для слабовидящих в рамках единой кодовой базы. Все пользователи
            работают с одной и той же системой; различия — на уровне
            пользовательских предпочтений (размер шрифта, контраст, скринридер).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-fg text-base font-semibold mb-2">
            Разделы ГОСТ Р 52872-2019, по которым достигнуто соответствие
          </h2>
          <ul className="text-fg-secondary text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Семантическая HTML-разметка, landmark-роли, skip-link «Перейти к основному содержимому»</li>
            <li>Полная клавиатурная навигация всех интерактивных элементов; видимый focus-индикатор</li>
            <li>Контраст ≥ 4.5:1 для основного текста, ≥ 3:1 для границ интерактивов в обеих темах</li>
            <li>Минимальный размер тап-цели 44×44 CSS-px (WCAG 2.5.5 AAA)</li>
            <li>SPA-навигация с управлением фокусом и обновлением document.title</li>
            <li>Реактивная смена атрибута <code>lang</code> при выборе локали</li>
            <li>Поддержка <code>prefers-reduced-motion</code></li>
            <li>Семантика таблиц для зачётной книжки и расписания</li>
            <li>Корректные ARIA-атрибуты на формах, поддержка autocomplete и менеджеров паролей</li>
            <li>Текстовые альтернативы для иконочных кнопок и декоративных элементов</li>
            <li>Размер шрифта S/M/L в настройках профиля</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-fg text-base font-semibold mb-2">Известные ограничения</h2>
          <p className="text-fg-secondary text-sm leading-relaxed mb-3">
            Цветовое кодирование типов занятий и контрольных мероприятий
            (Лекция/Практика/Лаб, экзамен/зачёт) использует тонированный фон с
            тем же цветом текста — контраст ниже AA. Это{" "}
            <strong>визуальное вспомогательное кодирование</strong>; смысл
            дублируется текстовой меткой рядом и доступен скринридеру.
            Классификация по политике §4.3: <strong>Minor</strong>.
          </p>
          <p className="text-fg-secondary text-sm leading-relaxed mb-3">
            SCORM-пакеты сторонних поставщиков имеют непредсказуемый уровень
            доступности. Платформа обеспечивает доступную обёртку-плеер; за
            доступность вложенного контента отвечает поставщик пакета (политика §2.4.1).
          </p>
          <p className="text-fg-secondary text-sm leading-relaxed">
            Полный реестр ведётся в репозитории{" "}
            <a
              href="https://github.com/iMironRU/Didaticon/issues?q=label%3Aaccessibility"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Дидактикона, метка «accessibility»
            </a>.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-fg text-base font-semibold mb-2">Обратная связь</h2>
          <p className="text-fg-secondary text-sm leading-relaxed mb-3">
            Если что-то не работает с вашим вспомогательным средством или у вас
            есть предложение — сообщите нам. SLA на ответ — 5 рабочих дней
            (политика §7.8).
          </p>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent("Доступность Дидактикона")}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface border-2 border-accent text-accent text-sm font-semibold no-underline min-h-[44px]"
          >
            <span aria-hidden="true">✉</span> Написать об ограничении ({supportEmail})
          </a>
          {branding.supportPhone && (
            <p className="text-fg-muted text-xs mt-2">
              Также можно по телефону: {branding.supportPhone}
            </p>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-fg text-base font-semibold mb-2">Даты</h2>
          <p className="text-fg-secondary text-sm">
            Дата последней оценки: <strong>{LAST_ASSESSMENT}</strong>
          </p>
          <p className="text-fg-secondary text-sm">
            Плановая переоценка: <strong>{NEXT_ASSESSMENT}</strong>
          </p>
        </section>

        <footer className="mt-8 pt-6 border-t border-line text-fg-dim text-xs leading-relaxed">
          <p>
            Декларация подготовлена в соответствии с архитектурной политикой
            доступности экосистемы. Полные спецификации:{" "}
            <a
              href="https://github.com/iMironRU/Didaticon/tree/main/docs/accessibility"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              docs/accessibility
            </a>{" "}
            в репозитории.
          </p>
        </footer>
      </main>
    </div>
  );
}
