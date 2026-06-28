/**
 * AdminShell — топ-бар + Tabs из UI-кита.
 */
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../src/ui/Tabs.js";
import { Button } from "../src/ui/Button.js";
import { StatusTab } from "./tabs/Status.js";
import { ConnectTab } from "./tabs/Connect.js";
import { BrandTab } from "./tabs/Brand.js";
import { SettingsTab } from "./tabs/Settings.js";
import { ContentTab } from "./tabs/Content.js";
import { ScenariosTab } from "./tabs/Scenarios.js";
import { LogsTab } from "./tabs/Logs.js";
import { UsersTab } from "./tabs/Users.js";

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;

interface Props {
  onLogout: () => void;
}

export function AdminShell({ onLogout }: Props) {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";
  const commit  = typeof __COMMIT_HASH__  !== "undefined" ? __COMMIT_HASH__  : "";

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Шапка */}
      <header className="bg-elevated border-b border-line px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <svg width="22" height="22" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="#4B9EE5"/>
          <path
            transform="translate(5,5) scale(0.917)"
            d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"
            stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </svg>
        <div className="flex-1">
          <div className="text-fg text-sm font-bold leading-tight">ЭИОС — Администрирование</div>
          <div className="text-fg-muted text-xs mt-0.5">v{version}{commit ? ` · ${commit}` : ""}</div>
        </div>
        <a
          href="/"
          className="text-fg-secondary hover:text-fg text-sm no-underline shrink-0"
          title="Вернуться в PWA"
        >
          ← К приложению
        </a>
        <Button variant="secondary" size="sm" onClick={onLogout}>Выйти</Button>
      </header>

      {/* Вкладки */}
      <Tabs defaultValue="status" className="flex-1 flex flex-col">
        <TabsList className="px-4 sm:px-6 shrink-0">
          <TabsTrigger value="status">Статус</TabsTrigger>
          <TabsTrigger value="connect">Подключение</TabsTrigger>
          <TabsTrigger value="brand">Брендинг</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
          <TabsTrigger value="content">Контент</TabsTrigger>
          <TabsTrigger value="scenarios">Мок-сценарии</TabsTrigger>
          <TabsTrigger value="logs">Логи</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8 max-w-4xl w-full mx-auto">
          <TabsContent value="status"><StatusTab /></TabsContent>
          <TabsContent value="connect"><ConnectTab /></TabsContent>
          <TabsContent value="brand"><BrandTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="content"><ContentTab /></TabsContent>
          <TabsContent value="scenarios"><ScenariosTab /></TabsContent>
          <TabsContent value="logs"><LogsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
