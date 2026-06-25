import type { FastifyInstance } from "fastify";
import type { Config } from "../config.js";

export function registerAdmin(app: FastifyInstance, { cfg }: { cfg: Config }) {
  // Статус: glue жив + проверяем JWKS + проверяем RPC.
  app.get("/admin/status", async () => {
    const checks = await Promise.allSettled([
      fetch(cfg.oidcJwksUrl).then(r => r.ok),
      fetch(cfg.univerkonRpcUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"jsonrpc":"2.0","method":"ping","id":1}' })
        .then(r => r.ok || r.status < 500),
    ]);

    return {
      glue: true,
      oidc:      checks[0].status === "fulfilled" && checks[0].value,
      univerkon: checks[1].status === "fulfilled" && checks[1].value,
      config: {
        domain:       process.env.EIOS_DOMAIN ?? "(не задан)",
        oidcIssuer:   cfg.oidcIssuer,
        univerkonRpc: cfg.univerkonRpcUrl,
        store:        cfg.store,
        role:         cfg.role,
      },
    };
  });
}
