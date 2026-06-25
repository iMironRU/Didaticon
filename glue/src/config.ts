export interface Config {
  port: number;
  store: "postgres" | "sqlite";
  sqlitePath: string;
  pgUrl: string;
  role: "central" | "edge";
  univerkonRpcUrl: string;
  univerkonServiceToken: string;
  oidcIssuer: string;
  oidcJwksUrl: string;
  oidcAudience: string;
  adminToken: string;
  scormPath: string;
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 8080),
    store: (process.env.EIOS_STORE as Config["store"]) ?? "sqlite",
    sqlitePath: process.env.EIOS_SQLITE_PATH ?? "./glue.sqlite",
    pgUrl: process.env.EIOS_PG_URL ?? "",
    role: (process.env.EIOS_ROLE as Config["role"]) ?? "central",
    univerkonRpcUrl: process.env.UNIVERKON_RPC_URL ?? "",
    univerkonServiceToken: process.env.UNIVERKON_SERVICE_TOKEN ?? "",
    oidcIssuer: process.env.OIDC_ISSUER ?? "",
    oidcJwksUrl: process.env.OIDC_JWKS_URL ?? "",
    oidcAudience: process.env.OIDC_AUDIENCE ?? "eios-glue",
    adminToken: process.env.ADMIN_TOKEN ?? "",
    scormPath: process.env.SCORM_PATH ?? "/scorm",
  };
}
