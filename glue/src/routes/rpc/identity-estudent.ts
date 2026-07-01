/**
 * identity.e_student.issue (Block I §9) — выпуск e-Student JWS.
 *
 * Студент получает токен на 24ч для предъявления охране/библиотеке. Токен
 * подписан glue'ом (или Univerkon'ом в реальности) и валидируется по
 * публичному JWKS — оффлайн-валидация на устройстве охранника.
 *
 * MVP: SignJWT с HS256 ключом из env GLUE_ESTUDENT_SECRET (или fallback
 * на dev-ключ). Реальная реализация — RS256 с приватным ключом, публичный
 * jwks выставлен в /jwks Univerkon'а.
 *
 * Payload (Block I §9.2):
 *   iss   — Univerkon issuer
 *   sub   — fp_id физика
 *   ctx   — student_context_id
 *   name  — ФИО
 *   photo_url — null если фото нет
 *   education_program — code/title/level/form
 *   year_of_admission, current_year
 *   iat / exp (24ч)
 */
import { SignJWT } from "jose";
import type { JWTPayload } from "jose";
import { RpcValidationError } from "./rpcError.js";

const ISSUER = process.env.GLUE_ESTUDENT_ISSUER ?? "https://didacticon.test/estudent";
const SECRET = new TextEncoder().encode(
  process.env.GLUE_ESTUDENT_SECRET ?? "dev-secret-replace-in-prod-please-do-not-use-this-in-real-life",
);
const TTL_SECONDS = 24 * 60 * 60;

interface IssueParams {
  student_context_id?: unknown;
}

/** Mock-карта данных студента по context_id — должны совпадать с identity-contexts.ts. */
const STUDENT_DATA: Record<string, { name: string; education_program: { code: string; title: string; level: string; form: string }; year_of_admission: number; current_year: number; photo_url: string | null }> = {
  "stu:s1": {
    name: "Иванов Иван Иванович",
    education_program: { code: "09.03.01", title: "Информатика и вычислительная техника", level: "bachelor", form: "full_time" },
    year_of_admission: 2023, current_year: 3, photo_url: null,
  },
  "stu:sm-1": {
    name: "Соколова Анна Дмитриевна",
    education_program: { code: "09.03.01", title: "Информатика и вычислительная техника", level: "bachelor", form: "full_time" },
    year_of_admission: 2023, current_year: 3, photo_url: null,
  },
  "stu:sm-2": {
    name: "Соколова Анна Дмитриевна",
    education_program: { code: "DPO-1C-2024", title: "1С: разработчик", level: "dpo", form: "part_time" },
    year_of_admission: 2025, current_year: 1, photo_url: null,
  },
  "stu:ps-1": {
    name: "Кузнецов Андрей Петрович",
    education_program: { code: "09.04.01", title: "Прикладная математика и информатика", level: "master", form: "part_time" },
    year_of_admission: 2024, current_year: 2, photo_url: null,
  },
  "stu:ts-master": {
    name: "Морозова Елена Викторовна",
    education_program: { code: "09.04.01", title: "Прикладная математика и информатика", level: "master", form: "part_time" },
    year_of_admission: 2025, current_year: 1, photo_url: null,
  },
};

interface EStudentResponse {
  token:    string;
  exp:      number;
  // payload дублируется в ответе чтобы UI мог сразу отрисовать без декодирования
  payload:  JWTPayload & { name: string; ctx: string; education_program: object; year_of_admission: number; current_year: number; photo_url: string | null };
}

export async function identityEStudentIssue(params: Record<string, unknown>, claims: JWTPayload): Promise<EStudentResponse> {
  const p = params as IssueParams;
  const ctx = typeof p.student_context_id === "string" ? p.student_context_id : "";
  if (!ctx) throw new RpcValidationError("missing student_context_id", "student_context_id");

  const data = STUDENT_DATA[ctx];
  if (!data) throw new RpcValidationError(`unknown student context: ${ctx}`, "student_context_id");

  const now = Math.floor(Date.now() / 1000);
  const exp = now + TTL_SECONDS;
  const sub = typeof claims.sub === "string" ? claims.sub : "fpid:unknown";

  const payload = {
    iss: ISSUER,
    sub,
    ctx,
    name: data.name,
    photo_url: data.photo_url,
    education_program: data.education_program,
    year_of_admission: data.year_of_admission,
    current_year: data.current_year,
    iat: now,
    exp,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(SECRET);

  return { token, exp, payload };
}
