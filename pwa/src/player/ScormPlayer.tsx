// Хост SCORM-контента. scorm-again даёт window.API/API_1484_11 в родительском
// фрейме; SCO живёт в iframe НА ТОМ ЖЕ origin — обнаружение API по дереву окон.
// Коммиты маршрутизируются в офлайн-буфер (adapter.ts), не напрямую в сеть.
import { useEffect, useRef } from "react";
import type { LaunchContext } from "@eios/contracts";
import { mountScormApi } from "./adapter.js";

export function ScormPlayer({ ctx }: { ctx: LaunchContext }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // API монтируем ДО того как iframe грузит SCO: src ставим через ref после mount.
    const unmount = mountScormApi(ctx);
    const iframe = iframeRef.current;
    if (iframe) iframe.src = ctx.packageUrl;

    return () => {
      // SCO должен сам позвать LMSFinish/Terminate до размонтирования.
      // Если не позвал — финальный коммит всё равно был при Finish.
      unmount();
    };
  // ctx меняется только при смене узла — пересоздаём весь плеер.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.eventId, ctx.attemptId]);

  return (
    <iframe
      ref={iframeRef}
      title={ctx.packageUrl}
      style={{ width: "100%", height: "100%", border: 0 }}
    />
  );
}
