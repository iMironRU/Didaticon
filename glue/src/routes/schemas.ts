// Общие JSON Schema фрагменты для REST-роутов glue (issue #68 — OpenAPI).
// Credential используется и в /commit, и в /resume — одно определение.
export const credentialSchema = {
  type: "object", required: ["kind", "value"],
  properties: {
    kind:  { type: "string", enum: ["oidc", "mtls"] },
    value: { type: "string" },
  },
} as const;
