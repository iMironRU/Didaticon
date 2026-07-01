// RFC 9457 (Problem Details for HTTP APIs) для REST-поверхности glue
// (/commit, /resume, /projection, /admin/*). НЕ используется в /rpc —
// у JSON-RPC свой стандарт ошибок {code, message, data}, см. routes/rpc.ts.
//
// code/action — наше расширение поверх RFC 9457 (спека это явно разрешает):
// code — стабильный машинный идентификатор для программной обработки клиентом,
// action — подсказка что делать дальше ("relogin" | "retry_later" | "contact_support").
import type { FastifyReply } from "fastify";

export interface ProblemDetails {
  type:    string;  // относительный URI типа ошибки, напр. "/errors/auth-rejected"
  title:   string;  // человекочитаемое описание ТИПА ошибки — одинаково для всех случаев
  status:  number;  // HTTP-код
  detail:  string;  // конкретная причина в этом случае
  code:    string;
  action?: "relogin" | "retry_later" | "contact_support";
}

export function sendProblem(reply: FastifyReply, problem: ProblemDetails): void {
  reply.status(problem.status).type("application/problem+json").send(problem);
}

export const Problems = {
  authRejected(detail: string): ProblemDetails {
    return {
      type: "/errors/auth-rejected", title: "Учётные данные отклонены",
      status: 401, detail, code: "AUTH_REJECTED", action: "relogin",
    };
  },
  adminDisabled(): ProblemDetails {
    return {
      type: "/errors/admin-disabled", title: "Панель администратора отключена",
      status: 403, detail: "ADMIN_TOKEN не задан — панель управления отключена",
      code: "ADMIN_DISABLED",
    };
  },
  adminUnauthorized(): ProblemDetails {
    return {
      type: "/errors/admin-unauthorized", title: "Неверный токен администратора",
      status: 401, detail: "Неверный токен администратора",
      code: "ADMIN_UNAUTHORIZED", action: "contact_support",
    };
  },
  validation(detail: string): ProblemDetails {
    return {
      type: "/errors/validation", title: "Некорректные данные запроса",
      status: 400, detail, code: "VALIDATION_ERROR",
    };
  },
  notFound(detail: string): ProblemDetails {
    return {
      type: "/errors/not-found", title: "Ресурс не найден",
      status: 404, detail, code: "NOT_FOUND",
    };
  },
  internal(detail: string): ProblemDetails {
    return {
      type: "/errors/internal", title: "Внутренняя ошибка сервера",
      status: 500, detail, code: "INTERNAL_ERROR", action: "retry_later",
    };
  },
};
