// Клиент к ядру Univerkon. Транспорт JSON-RPC + JWT (паттерн КандиМил).
// docs/glue-contracts.md §3.
import type {
  DepositSvidetelstvo,
  DepositResult,
  TrajectoryProjection,
  StudentId,
} from "@eios/contracts";
import type { Config } from "../config.js";

export class UniverkonClient {
  constructor(private cfg: Config) {}

  async depositSvidetelstvo(s: DepositSvidetelstvo): Promise<DepositResult> {
    // TODO(срез-1): POST JSON-RPC на UNIVERKON_RPC_URL с Bearer service-token.
    void this.cfg; void s;
    throw new Error("TODO(срез-1): depositSvidetelstvo");
  }

  async getTrajectory(studentId: StudentId): Promise<TrajectoryProjection> {
    // TODO(срез-1): GET JSON-RPC trajectory.get на UNIVERKON_RPC_URL,
    //   Bearer service-token + on-behalf-of studentId (scope ограничен).
    //   Univerkon возвращает список узлов с состоянием обязательств.
    void studentId;
    throw new Error("TODO(срез-1): getTrajectory — Univerkon RPC not wired");
  }
}
