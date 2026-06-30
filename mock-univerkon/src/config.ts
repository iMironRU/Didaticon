export interface Config {
  port:         number;
  sqlitePath:   string;
  adminToken:   string;
  serviceToken: string;  // glue предъявляет этот токен в Authorization: Bearer
  oidcJwksUrl:  string;  // только для логирования discovery; верификация JWT не включена в v0.1
}

export function loadConfig(): Config {
  return {
    port:         Number(process.env.PORT ?? 9000),
    sqlitePath:   process.env.SQLITE_PATH ?? ":memory:",
    adminToken:   process.env.MOCK_ADMIN_TOKEN ?? "mock-admin-dev",
    serviceToken: process.env.UNIVERKON_SERVICE_TOKEN ?? "ci-token",
    oidcJwksUrl:  process.env.OIDC_JWKS_URL ?? "",
  };
}
