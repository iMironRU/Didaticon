import { jsx as _jsx } from "react/jsx-runtime";
// Хост SCORM-контента. scorm-again даёт window.API/API_1484_11 в родительском
// фрейме; SCO живёт в iframe НА ТОМ ЖЕ origin (обнаружение API по дереву окон).
// Коммиты маршрутизируются в офлайн-буфер (adapter.ts), не напрямую в сеть.
import { useEffect, useRef } from "react";
import { mountScormApi } from "./adapter.js";
export function ScormPlayer(props) {
    const ref = useRef(null);
    useEffect(() => {
        const unmount = mountScormApi({
            eventId: props.eventId,
            attemptId: props.attemptId,
        });
        return unmount;
    }, [props.eventId, props.attemptId]);
    return _jsx("iframe", { ref: ref, src: props.packageUrl, style: { width: "100%", height: "100%", border: 0 } });
}
