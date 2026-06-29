/**
 * EStudentScreen — полноэкранная карточка обучающегося с QR (Block I §9).
 *
 * Дизайн:
 *  - Принудительно светлая тема (охрана сканирует на ярком свете)
 *  - Большое фото / инициалы
 *  - ФИО + ОП + год поступления + текущий курс
 *  - QR (JWS внутри) — крупный, центральный
 *  - Срок действия + кнопка "Обновить"
 *  - Закрыть → возврат назад
 *
 * Принудительная светлая тема — через атрибут data-theme="light" на корне
 * этого экрана (override относительно глобального).
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { loadEStudent, refreshEStudent, type EStudent } from "../data/eStudent.js";
import { Spinner } from "../ui/Spinner.js";
import { Button } from "../ui/Button.js";

interface Props {
  contextId: string;
  onBack:    () => void;
}

const LEVEL_LABEL: Record<string, string> = {
  bachelor: "Бакалавриат", master: "Магистратура", specialist: "Специалитет",
  spo: "СПО", dpo: "ДПО",
};
const FORM_LABEL: Record<string, string> = {
  full_time: "Очная", part_time: "Очно-заочная", distance: "Заочная",
};

export function EStudentScreen({ contextId, onBack }: Props) {
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ready"; data: EStudent } | { kind: "error"; message: string }>({ kind: "loading" });
  const [qrSvg, setQrSvg] = useState<string>("");

  // Force light theme на время монтирования
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadEStudent(contextId)
      .then((data) => {
        if (cancelled) return;
        setState({ kind: "ready", data });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setState({ kind: "error", message: msg });
      });
    return () => { cancelled = true; };
  }, [contextId]);

  // Когда токен готов — генерим SVG QR (большой, error correction H — устойчиво к загрязнению)
  useEffect(() => {
    if (state.kind !== "ready") return;
    QRCode.toString(state.data.token, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      width: 280,
      color: { dark: "#0D1822", light: "#FFFFFF" },
    }).then(setQrSvg).catch(() => setQrSvg(""));
  }, [state]);

  async function handleRefresh() {
    setState({ kind: "loading" });
    try {
      const data = await refreshEStudent(contextId);
      setState({ kind: "ready", data });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#F0F5FB", color: "#0D1822" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#C2D4E8", background: "#FFFFFF" }}>
        <button onClick={onBack} className="text-[0.95rem] bg-transparent border-0 cursor-pointer" style={{ color: "#1A69B5" }}>
          ‹ Закрыть
        </button>
        <div className="text-sm font-semibold" style={{ color: "#0D1822" }}>
          Студенческий
        </div>
        <div className="w-12" />
      </div>

      {/* Content */}
      {state.kind === "loading" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3" style={{ color: "#4A6888" }}>
            <Spinner size={20} /> Загрузка карты…
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm w-full rounded-2xl px-4 py-6 text-center" style={{ background: "#FFFFFF", border: "1px solid #C2D4E8" }}>
            <div className="text-3xl mb-2">⚠</div>
            <div className="text-base font-medium mb-2" style={{ color: "#DC2626" }}>Не удалось получить карту</div>
            <div className="text-sm mb-4" style={{ color: "#4A6888" }}>{state.message}</div>
            <Button variant="primary" size="md" className="w-full" onClick={handleRefresh}>
              Попробовать снова
            </Button>
          </div>
        </div>
      )}

      {state.kind === "ready" && (
        <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-8">
          {/* Photo / initials */}
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold mb-4 mt-2"
               style={{ background: "#1A69B5", color: "#FFFFFF" }}>
            {state.data.payload.photo_url
              ? <img src={state.data.payload.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
              : state.data.payload.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </div>

          {/* Name */}
          <div className="text-lg font-semibold text-center" style={{ color: "#0D1822" }}>
            {state.data.payload.name}
          </div>

          {/* Program */}
          <div className="text-sm text-center mt-1 mb-1" style={{ color: "#2A4A6A" }}>
            {state.data.payload.education_program.code} · {state.data.payload.education_program.title}
          </div>
          <div className="text-xs text-center mb-5" style={{ color: "#4A6888" }}>
            {LEVEL_LABEL[state.data.payload.education_program.level] ?? state.data.payload.education_program.level}
            {" · "}
            {FORM_LABEL[state.data.payload.education_program.form] ?? state.data.payload.education_program.form}
            {" · "}
            {state.data.payload.current_year} курс
          </div>

          {/* QR */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: "#FFFFFF", border: "1px solid #C2D4E8" }}>
            {qrSvg
              ? <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
              : <div style={{ width: 280, height: 280 }} className="flex items-center justify-center">
                  <Spinner size={24} />
                </div>}
          </div>

          {/* Validity */}
          <div className="text-xs text-center mb-3" style={{ color: "#4A6888" }}>
            Действует до {formatDate(state.data.exp)}
          </div>

          {/* Refresh button */}
          <Button variant="ghost" size="sm" onClick={handleRefresh} style={{ color: "#1A69B5" }}>
            ↻ Обновить
          </Button>
        </div>
      )}
    </div>
  );
}

function formatDate(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}
