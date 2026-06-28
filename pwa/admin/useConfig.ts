/**
 * useConfig — хук для загрузки/сохранения CONFIG_KEYS.
 *
 * Glue API: GET /admin/config возвращает массив { key, label, tab, secret,
 * restart, html, toggle, note, envValue, savedValue, effectiveValue }.
 */
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "./auth.js";

export interface ConfigKey {
  key:            string;
  label:          string;
  tab:            string;
  secret:         boolean;
  restart:        boolean;
  html:           boolean;
  toggle:         boolean;
  note:           string | null;
  envValue:       string;
  savedValue:     string | null;
  effectiveValue: string;
}

export function useConfig() {
  const [items, setItems] = useState<ConfigKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const r = await apiFetch("/admin/config");
    if (!r.ok) { setError(`HTTP ${r.status}`); return; }
    setItems(await r.json() as ConfigKey[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (patch: Record<string, string>) => {
    const r = await apiFetch("/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const result = await r.json() as { ok: boolean; needsRestart: string[]; message: string };
    await load();
    return result;
  }, [load]);

  return { items, error, save, reload: load };
}
