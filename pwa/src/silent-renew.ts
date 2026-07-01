// Точка входа /silent-renew.html — грузится в СКРЫТОМ iframe для
// automaticSilentRenew (см. oidc.ts). Отдельная страница (не /callback),
// чтобы не запускать здесь весь React-бандл и popup/redirect-детект из
// main.tsx — silent-renew ничего не рендерит, только обрабатывает ответ
// и отдаёт его обратно в родительское окно.
import { handleSilentCallback } from "./auth/oidc.js";

void handleSilentCallback();
