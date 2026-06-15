// Клиент к ядру Univerkon. Единственный метод — deposit_svidetelstvo.
// Транспорт JSON-RPC + JWT (паттерн КандиМил). docs/glue-contracts.md §3.
import type { DepositSvidetelstvo, DepositResult } from "@eios/contracts";
import type { Config } from "../config.js";

export class UniverkonClient {
  constructor(private cfg: Config) {}

  async depositSvidetelstvo(s: DepositSvidetelstvo): Promise<DepositResult> {
    // TODO(срез-1): POST JSON-RPC на UNIVERKON_RPC_URL с Bearer service-token.
    //   Univerkon создаёт запись (черновое), считает закрытость (§5),
    //   при negative — пересдача/задолженность (§11). Здесь только проводка.
    void this.cfg;
    void s;
    throw new Error("TODO(срез-1)");
  }
}
