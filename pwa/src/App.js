import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { login, getStudent } from "./auth/oidc.js";
import { Trajectory } from "./projections/trajectory.js";
// Тонкий студенческий кабинет. Всё — проекции из Univerkon + плеер + лончи.
export function App() {
    const [studentId, setStudentId] = useState(null);
    useEffect(() => {
        getStudent().then((s) => setStudentId(s?.id ?? null));
    }, []);
    if (!studentId) {
        return _jsx("button", { onClick: () => void login(), children: "\u0412\u043E\u0439\u0442\u0438" });
    }
    return _jsx(Trajectory, { studentId: studentId });
}
