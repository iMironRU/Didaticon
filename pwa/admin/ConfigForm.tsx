/**
 * ConfigForm — рендерит поля CONFIG_KEYS отфильтрованные по tab.
 *
 * Типы полей:
 * - toggle  — switch (LESSON_RATING_ENABLED, DEMO_LOGIN_ENABLED)
 * - html    — textarea (BRANDING_ACCESS_INFO)
 * - secret  — type=password (OIDC_CLIENT_SECRET, UNIVERKON_SERVICE_TOKEN)
 * - default — type=text
 */
import { useState, useEffect } from "react";
import { Button } from "../src/ui/Button.js";
import { Input } from "../src/ui/Input.js";
import { useToast } from "../src/ui/Toast.js";
import { useConfig, type ConfigKey } from "./useConfig.js";

interface Props {
  tab: string;
}

const TOGGLE_DESCR: Record<string, string> = {
  LESSON_RATING_ENABLED: "Студенты могут оценить занятие (👍/👎) после прохождения",
  DEMO_LOGIN_ENABLED:    "Блок «Тестовый вход» на странице логина (для разработки)",
};

export function ConfigForm({ tab }: Props) {
  const { items, error, save } = useConfig();
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Сброс dirty когда меняется набор полей
  useEffect(() => { setDirty({}); }, [items]);

  if (error) return <ErrorBlock msg={error} />;
  if (!items) return <div className="text-fg-muted text-sm py-4">Загрузка…</div>;

  const fields = items.filter(f => f.tab === tab);
  if (fields.length === 0) return <div className="text-fg-muted text-sm py-4">Полей нет</div>;

  function update(key: string, value: string) {
    setDirty(d => ({ ...d, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    try {
      const result = await save(dirty);
      setDirty({});
      toast({
        title: "Сохранено",
        description: result.needsRestart.length
          ? `После перезапуска: ${result.needsRestart.join(", ")}`
          : undefined,
        variant: "success",
      });
    } catch (e) {
      toast({ title: "Ошибка", description: String(e), variant: "danger" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-4 flex flex-col gap-4">
      {fields.map(f => (
        <Field key={f.key} field={f} draft={dirty[f.key]} onChange={v => update(f.key, v)} />
      ))}

      <div className="flex justify-end pt-2">
        <Button onClick={submit} disabled={saving || Object.keys(dirty).length === 0}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}

function Field({ field, draft, onChange }: { field: ConfigKey; draft?: string; onChange: (v: string) => void }) {
  if (field.toggle) {
    const currentRaw = draft ?? field.savedValue ?? field.envValue;
    const checked = currentRaw !== "false" && currentRaw !== "";
    return (
      <ToggleRow
        label={field.label}
        description={TOGGLE_DESCR[field.key]}
        checked={checked}
        onChange={v => onChange(v ? "true" : "false")}
        restart={field.restart}
      />
    );
  }

  const value = draft ?? field.savedValue ?? (field.secret ? "" : field.envValue);
  const savedNote = field.savedValue !== null
    ? "✏ Сохранено в БД. Очистите чтобы вернуться к env."
    : null;

  return (
    <label className="block">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-fg text-sm font-medium">{field.label}</span>
        {field.restart && <span className="text-fg-muted text-[0.65rem]">↺ требует рестарт</span>}
        {field.note && <span className="text-fg-muted text-[0.65rem]">{field.note}</span>}
      </div>
      {field.html ? (
        <textarea
          className="w-full min-h-[140px] px-3 py-2 text-sm bg-canvas border border-line rounded-md text-fg placeholder:text-fg-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.secret ? "(secret — оставьте пустым чтобы не менять)" : ""}
        />
      ) : (
        <Input
          type={field.secret ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.secret ? "(secret — оставьте пустым чтобы не менять)" : ""}
        />
      )}
      {savedNote && <div className="text-fg-muted text-xs mt-1">{savedNote}</div>}
    </label>
  );
}

function ToggleRow({ label, description, checked, onChange, restart }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; restart?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-line">
      <div className="flex-1 min-w-0">
        <div className="text-fg text-sm font-medium">
          {label}
          {restart && <span className="text-fg-muted text-[0.65rem] ml-2">↺ рестарт</span>}
        </div>
        {description && <div className="text-fg-muted text-xs mt-0.5">{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        className={
          "relative w-11 h-6 rounded-full transition-colors shrink-0 " +
          (checked ? "bg-accent" : "bg-line")
        }
        onClick={() => onChange(!checked)}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

function ErrorBlock({ msg }: { msg: string }) {
  return (
    <div className="my-4 px-3 py-2 bg-[color-mix(in_srgb,var(--c-danger)_10%,transparent)] border border-danger rounded-lg text-danger text-sm">
      Ошибка загрузки: {msg}
    </div>
  );
}
