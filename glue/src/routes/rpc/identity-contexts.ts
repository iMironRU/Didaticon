/**
 * identity.contexts.get (Block I §8) — boot-API контекстов физика.
 *
 * Сейчас mock — заполняется по `email` из claims (или `sub` как fallback).
 * Когда подключим реальный Univerkon, этот файл удалится: glue будет проксировать
 * запрос в Univerkon как есть.
 *
 * Структура ответа — точно по Block I §8.2.
 */
import type { JWTPayload } from "jose";

interface EducationProgram {
  code:  string;
  title: string;
  level: "bachelor" | "master" | "specialist" | "spo" | "dpo" | string;
  form:  "full_time" | "part_time" | "distance" | string;
}

interface StudentContext {
  context_id:        string;
  education_program: EducationProgram;
  year_of_admission: number;
  current_semester:  number;
}

interface ParentContext {
  context_id: string;
  child: {
    fp_id:             string;
    name:              string;
    education_program: EducationProgram;
  };
}

interface TeacherContext {
  context_id: string;
  kind: "instructor" | "senior_grader" | "curator";
}

interface ExaminerContext {
  context_id: string;
  event: { id: string; title: string; dates: { from: string; to: string } };
}

interface ApplicantContext {
  context_id: string;
  application: { id: string; direction: string; status: string };
}

interface ContextsResponse {
  student:   StudentContext[];
  parent:    ParentContext[];
  teacher:   TeacherContext[];
  examiner:  ExaminerContext[];
  applicant: ApplicantContext[];
}

/** Карта моков по email тестового юзера. */
const MOCK_BY_EMAIL: Record<string, ContextsResponse> = {
  "student@didacticon.test": {
    student: [{
      context_id: "stu:s1",
      education_program: {
        code: "09.03.01", title: "Информатика и вычислительная техника",
        level: "bachelor", form: "full_time",
      },
      year_of_admission: 2023,
      current_semester:  6,
    }],
    parent: [], teacher: [], examiner: [], applicant: [],
  },

  "student-multi@didacticon.test": {
    student: [
      {
        context_id: "stu:sm-1",
        education_program: {
          code: "09.03.01", title: "Информатика и вычислительная техника",
          level: "bachelor", form: "full_time",
        },
        year_of_admission: 2023, current_semester: 6,
      },
      {
        context_id: "stu:sm-2",
        education_program: {
          code: "DPO-1C-2024", title: "1С: разработчик",
          level: "dpo", form: "part_time",
        },
        year_of_admission: 2025, current_semester: 2,
      },
    ],
    parent: [], teacher: [], examiner: [], applicant: [],
  },

  "parent@didacticon.test": {
    student: [],
    parent: [{
      context_id: "par:p1-c1",
      child: {
        fp_id: "fpid:mock-child-001",
        name: "Воронова Анна Игоревна",
        education_program: {
          code: "09.03.01", title: "Информатика и вычислительная техника",
          level: "bachelor", form: "full_time",
        },
      },
    }],
    teacher: [], examiner: [], applicant: [],
  },

  "parent-student@didacticon.test": {
    student: [{
      context_id: "stu:ps-1",
      education_program: {
        code: "09.04.01", title: "Прикладная математика и информатика",
        level: "master", form: "part_time",
      },
      year_of_admission: 2024, current_semester: 4,
    }],
    parent: [
      {
        context_id: "par:ps-c1",
        child: {
          fp_id: "fpid:mock-child-101",
          name: "Кузнецов Иван Андреевич",
          education_program: {
            code: "09.03.01", title: "Информатика и вычислительная техника",
            level: "bachelor", form: "full_time",
          },
        },
      },
      {
        context_id: "par:ps-c2",
        child: {
          fp_id: "fpid:mock-child-102",
          name: "Кузнецова Мария Андреевна",
          education_program: {
            code: "44.02.02", title: "Преподавание в начальных классах",
            level: "spo", form: "full_time",
          },
        },
      },
    ],
    teacher: [], examiner: [], applicant: [],
  },

  "teacher@didacticon.test":         { student: [], parent: [], teacher: [{ context_id: "tch:t1",   kind: "instructor"    }], examiner: [], applicant: [] },
  "teacher-curator@didacticon.test": { student: [], parent: [], teacher: [{ context_id: "tch:tc1",  kind: "curator"       }], examiner: [], applicant: [] },
  "teacher-senior@didacticon.test":  { student: [], parent: [], teacher: [{ context_id: "tch:tsg1", kind: "senior_grader" }], examiner: [], applicant: [] },

  "teacher-student@didacticon.test": {
    student: [{
      context_id: "stu:ts-master",
      education_program: {
        code: "09.04.01", title: "Прикладная математика и информатика",
        level: "master", form: "part_time",
      },
      year_of_admission: 2025, current_semester: 2,
    }],
    parent: [], teacher: [{ context_id: "tch:ts1", kind: "instructor" }], examiner: [], applicant: [],
  },

  "examiner@didacticon.test": {
    student: [], parent: [], teacher: [],
    examiner: [{
      context_id: "exm:e1",
      event: {
        id: "exm-evt-001", title: "ГИА — защита ВКР",
        dates: { from: "2026-06-15", to: "2026-06-25" },
      },
    }],
    applicant: [],
  },

  "applicant@didacticon.test": {
    student: [], parent: [], teacher: [], examiner: [],
    applicant: [{
      context_id: "apl:a1",
      application: {
        id: "apl-001", direction: "09.03.01 Информатика и ВТ", status: "submitted",
      },
    }],
  },
};

const EMPTY: ContextsResponse = { student: [], parent: [], teacher: [], examiner: [], applicant: [] };

/** Хэндлер identity.contexts.get. params пустой (backend знает юзера по токену). */
export async function identityContextsGet(_params: Record<string, unknown>, claims: JWTPayload): Promise<ContextsResponse> {
  const email = typeof claims.email === "string" ? claims.email : null;
  if (email && MOCK_BY_EMAIL[email]) {
    return MOCK_BY_EMAIL[email];
  }
  // Если email не известен (или юзер залогинился не из тестовых) —
  // отдаём пустые массивы. Реальный Univerkon отдаст реальные данные.
  return EMPTY;
}
