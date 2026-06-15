// Снимок CMI за фасадом (docs/glue-contracts.md §6).
// Форма хранения активности — приватная сменяемая деталь; наружу не протекает.
// Алиас именован, чтобы тип читался по смыслу, а не как голый record.

export type CmiSnapshot = Record<string, unknown>;
