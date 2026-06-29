import { useState } from "react";
import { applySwUpdate } from "../sw-update.js";
import { useLocale } from "../locale.js";
import { usePersonIdLabel } from "../branding/usePersonIdLabel.js";
import { Button } from "../ui/Button.js";

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;

interface Props {
  swUpdate: boolean;
  eiv:      string;
}

export function StatusBar({ swUpdate, eiv }: Props) {
  const { t } = useLocale();
  const personIdLabel = usePersonIdLabel();
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";
  const commit  = typeof __COMMIT_HASH__  !== "undefined" ? __COMMIT_HASH__  : "";
  const [copied, setCopied] = useState(false);

  function copySupportInfo() {
    const screen = window.location.pathname;
    const parts  = [`ЭИОС v${version}`, commit, `${personIdLabel} ${eiv}`, screen].filter(Boolean);
    navigator.clipboard.writeText(parts.join(" · ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-elevated border-t border-line shrink-0">
      <div>
        {swUpdate && (
          <Button size="sm" onClick={applySwUpdate}>{t("updateApp")}</Button>
        )}
      </div>
      <button
        className="bg-transparent border-0 cursor-pointer p-0"
        onClick={copySupportInfo}
        title={t("copyForSupport")}
      >
        {copied
          ? <span className="text-success text-[0.62rem]">✓ {t("copied")}</span>
          : <span className="text-fg-dim text-[0.62rem]">v{version}{commit ? ` · ${commit}` : ""}</span>
        }
      </button>
    </div>
  );
}
