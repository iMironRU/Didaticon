import { useEffect, useState } from "react";
import type { StudentId } from "@eios/contracts";
import { login, getStudent } from "./auth/oidc.js";
import { Trajectory } from "./projections/trajectory.js";

// Тонкий студенческий кабинет. Всё — проекции из Univerkon + плеер + лончи.
export function App() {
  const [studentId, setStudentId] = useState<StudentId | null>(null);

  useEffect(() => {
    void getStudent().then((s) => setStudentId(s?.id ?? null));
  }, []);

  if (!studentId) {
    return <button onClick={() => void login()}>Войти</button>;
  }
  return <Trajectory studentId={studentId} />;
}
