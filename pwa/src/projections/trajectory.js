import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Проекция траектории/дисциплин из Univerkon. stale-while-revalidate +
// метка свежести (§6.2): лежачая 1С → показываем устаревшее, помеченным.
// TODO(срез-1): fetch проекции через /api, кеш в IndexedDB, метка времени.
export function Trajectory({ studentId }) {
    return (_jsxs("div", { children: [_jsx("h1", { children: "\u041C\u043E\u0438 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B" }), _jsxs("p", { children: ["studentId: ", studentId] })] }));
}
