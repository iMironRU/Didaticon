import { useEffect, useState } from "react";
import { Card } from "../../src/ui/Card.js";
import { Button } from "../../src/ui/Button.js";
import { Spinner } from "../../src/ui/Spinner.js";
import { useToast } from "../../src/ui/Toast.js";
import { useConfirm } from "../../src/ui/Confirm.js";
import { apiFetch } from "../auth.js";

interface Status {
  glue:         boolean;
  oidc:         boolean;
  univerkon:    boolean;
  adminEnabled: boolean;
  config: {
    domain:       string;
    oidcIssuer:   string;
    univerkonRpc: string;
    store:        string;
    role:         string;
  };
}

export function StatusTab() {
  const [data, setData]   = useState<Status | null>(null);
  const [busy, setBusy]   = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  async function load() {
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/admin/status");  // публичный endpoint, без auth
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json() as Status);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function restart() {
    const ok = await confirm({
      title: "Перезапустить glue?",
      description: "Все активные подключения прервутся на несколько секунд.",
      confirmLabel: "Перезапустить",
      variant: "danger",
    });
    if (!ok) return;
    const r = await apiFetch("/admin/restart", { method: "POST" });
    if (r.ok) {
      toast({ title: "Перезапуск", description: "Сервис перезапускается…", variant: "success" });
      setTimeout(load, 3000);
    } else {
      toast({ title: "Ошибка", description: `HTTP ${r.status}`, variant: "danger" });
    }
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-fg text-base font-semibold">Сервисы</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={load} disabled={busy}>↺ Обновить</Button>
          <Button variant="danger" size="sm" onClick={restart}>⟳ Перезапустить glue</Button>
        </div>
      </div>

      {busy && <div className="flex items-center gap-2 text-fg-muted text-sm"><Spinner /> Загрузка…</div>}
      {error && <div className="px-3 py-2 bg-[color-mix(in_srgb,var(--c-danger)_10%,transparent)] border border-danger rounded-lg text-danger text-sm">{error}</div>}

      {data && (
        <>
          <Card className="p-4 space-y-2">
            <Row label="Glue"            ok={data.glue} />
            <Row label="OIDC JWKS"        ok={data.oidc} />
            <Row label="Univerkon RPC"    ok={data.univerkon} />
            <Row label="Admin API"        ok={data.adminEnabled} hint={!data.adminEnabled ? "ADMIN_TOKEN не задан" : undefined} />
          </Card>

          <Card className="p-4">
            <h3 className="text-fg text-sm font-semibold mb-3">Конфигурация</h3>
            <table className="w-full text-sm">
              <tbody>
                <ConfigRow k="Домен"          v={data.config.domain} />
                <ConfigRow k="OIDC Issuer"    v={data.config.oidcIssuer} />
                <ConfigRow k="Univerkon RPC"  v={data.config.univerkonRpc} />
                <ConfigRow k="Хранилище"      v={data.config.store} />
                <ConfigRow k="Роль узла"      v={data.config.role} />
              </tbody>
            </table>
          </Card>

          {(!data.oidc || !data.univerkon) && (
            <div className="px-3 py-2 bg-[color-mix(in_srgb,var(--c-danger)_8%,transparent)] border border-danger rounded-lg text-danger text-sm">
              Один или несколько сервисов недоступны. Проверьте вкладку «Подключение».
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: ok ? "var(--c-success)" : "var(--c-danger)" }}
      />
      <span className="text-fg text-sm flex-1">{label}</span>
      {hint && <span className="text-fg-muted text-xs">{hint}</span>}
    </div>
  );
}

function ConfigRow({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-t border-line first:border-t-0">
      <td className="py-2 pr-4 text-fg-muted text-xs">{k}</td>
      <td className="py-2 text-fg text-xs font-mono break-all">{v || "—"}</td>
    </tr>
  );
}
