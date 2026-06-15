// Аутентификация запроса к клею (docs/glue-contracts.md §2, §15.8).
// PWA → OIDC-токен Univerkon; станция локальной зоны → mTLS-серт (свидетель-credential).
import type { Credential } from "@eios/contracts";
import type { Config } from "../config.js";

export interface Principal {
  studentId: string;
  plane: "human" | "technical";
}

export async function verify(cred: Credential, _cfg: Config): Promise<Principal> {
  // TODO(срез-1): OIDC — проверить подпись по JWKS Univerkon (jose),
  //   достать studentId из claims; mtls — сверить серт станции по allowlist.
  // §15.8: техническая плоскость держит только witness; validate ей недоступен.
  if (cred.kind === "oidc") {
    return { studentId: "TODO", plane: "human" };
  }
  return { studentId: "TODO", plane: "technical" };
}
