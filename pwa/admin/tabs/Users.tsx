import { Stub } from "./Stub.js";

export function UsersTab() {
  return (
    <Stub
      title="Пользователи"
      description="Список Auth0-юзеров через Management API + ссылка на Auth0 dashboard. Возможность задать роль (student/parent/teacher/admin) через user_metadata."
      todo="Появится одновременно с подключением Univerkon — сейчас юзеры создаются вручную в Auth0."
    />
  );
}
