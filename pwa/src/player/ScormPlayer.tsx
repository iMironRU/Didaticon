// Хост SCORM-контента. scorm-again даёт window.API/API_1484_11 в родительском
// фрейме; SCO живёт в iframe НА ТОМ ЖЕ origin (обнаружение API по дереву окон).
// Коммиты маршрутизируются в офлайн-буфер (adapter.ts), не напрямую в сеть.
import { useEffect, useRef } from "react";
import type { LaunchContext } from "@eios/contracts";
import { mountScormApi } from "./adapter.js";

export function ScormPlayer(props: { ctx: LaunchContext }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => mountScormApi(props.ctx), [props.ctx]);

  return (
    <iframe
      ref={ref}
      src={props.ctx.packageUrl}
      style={{ width: "100%", height: "100%", border: 0 }}
    />
  );
}
