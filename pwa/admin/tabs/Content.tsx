/**
 * Контент — SCORM-пакеты (и в будущем lesson packages в формате lesson_package.md).
 */
import { useEffect, useState } from "react";
import { Card } from "../../src/ui/Card.js";
import { Button } from "../../src/ui/Button.js";
import { Spinner } from "../../src/ui/Spinner.js";
import { useToast } from "../../src/ui/Toast.js";
import { useConfirm } from "../../src/ui/Confirm.js";
import { apiFetch } from "../auth.js";

interface ScormPkg {
  id:       string;
  hasIndex: boolean;
  url:      string;
}

export function ContentTab() {
  const [packages, setPackages] = useState<ScormPkg[] | null>(null);
  const [busy, setBusy]         = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  async function load() {
    setBusy(true);
    const r = await apiFetch("/admin/scorm");
    if (r.ok) setPackages(await r.json() as ScormPkg[]);
    setBusy(false);
  }

  useEffect(() => { void load(); }, []);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await apiFetch("/admin/scorm", { method: "POST", body: fd });
    setUploading(false);
    if (r.ok) {
      toast({ title: "Загружено", description: file.name, variant: "success" });
      load();
    } else {
      toast({ title: "Ошибка загрузки", description: `HTTP ${r.status}`, variant: "danger" });
    }
  }

  async function del(id: string) {
    const ok = await confirm({
      title: "Удалить SCORM-пакет?",
      description: `Файл «${id}» будет удалён без возможности восстановления.`,
      confirmLabel: "Удалить",
      variant: "danger",
    });
    if (!ok) return;
    const r = await apiFetch(`/admin/scorm/${id}`, { method: "DELETE" });
    if (r.ok) {
      toast({ title: "Удалено", description: id });
      load();
    } else {
      toast({ title: "Ошибка", description: `HTTP ${r.status}`, variant: "danger" });
    }
  }

  return (
    <div className="py-4 space-y-4">
      <div>
        <h2 className="text-fg text-base font-semibold">Контент</h2>
        <p className="text-fg-muted text-sm mt-1">
          SCORM-пакеты. В будущем — собственный формат lesson packages.
        </p>
      </div>

      {/* Загрузка */}
      <Card className="p-4">
        <h3 className="text-fg text-sm font-semibold mb-2">Загрузить SCORM (.zip)</h3>
        <input
          type="file"
          accept=".zip"
          disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
          className="block w-full text-sm text-fg file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-accent file:text-white file:cursor-pointer file:text-sm file:font-medium"
        />
        {uploading && <div className="flex items-center gap-2 mt-3 text-fg-muted text-sm"><Spinner /> Загрузка…</div>}
      </Card>

      {/* Список */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-fg text-sm font-semibold">Установленные пакеты</h3>
          <Button variant="secondary" size="sm" onClick={load} disabled={busy}>↺ Обновить</Button>
        </div>

        {busy && <div className="flex items-center gap-2 text-fg-muted text-sm"><Spinner /> Загрузка…</div>}

        {packages && packages.length === 0 && (
          <div className="text-fg-muted text-sm py-4 text-center">Пакетов нет</div>
        )}

        {packages && packages.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-fg-muted text-xs uppercase tracking-wider">
                <th className="text-left pb-2">ID</th>
                <th className="text-left pb-2">index.html</th>
                <th className="text-right pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map(p => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2 text-fg font-mono text-xs">{p.id}</td>
                  <td className="py-2">
                    {p.hasIndex
                      ? <a href={p.url} target="_blank" rel="noopener" className="text-accent text-xs no-underline">открыть ↗</a>
                      : <span className="text-danger text-xs">нет</span>}
                  </td>
                  <td className="py-2 text-right">
                    <Button variant="danger" size="sm" onClick={() => del(p.id)}>Удалить</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
