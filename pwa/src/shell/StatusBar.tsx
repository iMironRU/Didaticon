import { useState } from "react";
import type { CSSProperties } from "react";
import { applySwUpdate } from "../sw-update.js";
import { useLocale } from "../locale.js";

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;

interface Props {
  swUpdate: boolean;
  eiv:      string;
}

export function StatusBar({ swUpdate, eiv }: Props) {
  const { t } = useLocale();
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";
  const commit  = typeof __COMMIT_HASH__  !== "undefined" ? __COMMIT_HASH__  : "";
  const [copied, setCopied] = useState(false);

  function copySupportInfo() {
    const screen = window.location.pathname;
    const parts  = [`ЭИОС v${version}`, commit, `ЕИВ ${eiv}`, screen].filter(Boolean);
    navigator.clipboard.writeText(parts.join(" · ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={st.bar}>
      <div>
        {swUpdate && (
          <button style={st.updateBtn} onClick={applySwUpdate}>{t("updateApp")}</button>
        )}
      </div>
      <button style={st.versionBtn} onClick={copySupportInfo} title={t("copyForSupport")}>
        {copied
          ? <span style={st.copied}>✓ {t("copied")}</span>
          : <span style={st.versionLabel}>v{version}{commit ? ` · ${commit}` : ""}</span>
        }
      </button>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  bar:          { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", background: "var(--c-header)", borderTop: "0.5px solid var(--c-border)", flexShrink: 0 },
  versionBtn:   { background: "none", border: "none", cursor: "pointer", padding: 0 },
  versionLabel: { color: "var(--c-text-dim)", fontSize: "0.62rem" },
  copied:       { color: "var(--c-success)", fontSize: "0.62rem" },
  updateBtn:    { border: "none", background: "var(--c-accent)", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", cursor: "pointer" },
};
