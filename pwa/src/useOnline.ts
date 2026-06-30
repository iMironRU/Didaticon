/**
 * useOnline — реактивный статус сетевого соединения.
 *
 * navigator.onLine — индикатор браузера; на iOS Safari работает корректно
 * после изменения сети, на других платформах может давать false-positive
 * "онлайн" пока запрос не упадёт. Этого достаточно для UI-индикатора.
 */
import { useEffect, useState } from "react";

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const goOnline  = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}
