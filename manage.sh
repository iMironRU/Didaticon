#!/usr/bin/env bash
# manage.sh — ЭИОС Didaticon: установка, обновление, настройка, удаление.
#
#   bash manage.sh
#   bash <(curl -fsSL https://raw.githubusercontent.com/iMironRU/Didaticon/main/manage.sh)

set -euo pipefail

# ── Цвета и утилиты ──────────────────────────────────────────────────────────
GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'
CYAN='\033[1;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
ORANGE='\033[1;33m'

log()  { printf "${GREEN}  ✓${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}  !${NC}  %s\n" "$*"; }
err()  { printf "${RED}  ✗${NC}  %s\n" "$*" >&2; }
step() { printf "${CYAN}${BOLD}▶${NC}  %s\n" "$*"; }

LOG_FILE="/tmp/eios-$(date +%Y%m%d-%H%M%S).log"

RAW="https://raw.githubusercontent.com/iMironRU/Didaticon/main"
INSTALL_DIR="${HOME}/eios"
GLUE_IMAGE="ghcr.io/imironru/didaticon-glue:latest"
PWA_IMAGE="ghcr.io/imironru/didaticon-pwa:latest"

# Файлы которые скачиваем на сервер — только то что нужно для compose
COMPOSE_FILES=(docker-compose.yml docker-compose.prod.yml Caddyfile .env.example)

run_spin() {
  local msg="$1"; shift
  printf "  ${CYAN}⠋${NC}  %s..." "$msg"
  "$@" >> "$LOG_FILE" 2>&1 &
  local pid=$! frames='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏' i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${CYAN}${frames:$i:1}${NC}  %s..." "$msg"
    i=$(( (i+1) % 10 )); sleep 0.12
  done
  wait "$pid" || {
    printf "\r  ${RED}✗${NC}  %s — ошибка!\n" "$msg"
    tail -n 20 "$LOG_FILE" | sed 's/^/      /' >&2
    echo; err "Лог: $LOG_FILE"; exit 1
  }
  printf "\r  ${GREEN}✓${NC}  %s   \n" "$msg"
}

# ── Helpers ───────────────────────────────────────────────────────────────────
_find_install_dir() {
  # Рядом со скриптом (если запущен из каталога установки)
  local s; s="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd 2>/dev/null || true)"
  [ -f "${s}/docker-compose.yml" ] && { echo "$s"; return; }
  # Стандартный каталог
  [ -f "${INSTALL_DIR}/docker-compose.yml" ] && { echo "${INSTALL_DIR}"; return; }
  echo ""
}

_detect_dc() {
  if docker compose version >/dev/null 2>&1; then echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"
  else err "Docker Compose не найден."; exit 1; fi
}

_dc_cmd() { echo "$(_detect_dc) -f ${1}/docker-compose.yml -f ${1}/docker-compose.prod.yml"; }

_env_get() { grep -E "^${1}=" "${2}" 2>/dev/null | cut -d= -f2- || true; }
_env_set() {
  local key="$1" val="$2" file="$3"
  if grep -qE "^${key}=" "$file" 2>/dev/null; then
    local tmp; tmp=$(mktemp)
    grep -v "^${key}=" "$file" > "$tmp"
    printf '%s=%s\n' "$key" "$val" >> "$tmp"
    mv "$tmp" "$file"
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
}

_fetch() {
  # Скачивает файл из репозитория. _fetch <имя_файла> [целевой_путь]
  local name="$1" dest="${2:-$1}"
  curl -fsSL --max-time 15 "${RAW}/${name}" -o "$dest" 2>>"$LOG_FILE"
}

# ── Статус установки / обновления ────────────────────────────────────────────
_install_status() {
  local dir; dir="$(_find_install_dir)"
  [ -n "$dir" ] && echo "installed" || echo "not_installed"
}

_update_status() {
  local local_digest
  local_digest="$(docker inspect --format='{{index .RepoDigests 0}}' "$GLUE_IMAGE" 2>/dev/null \
    | grep -o 'sha256:[a-f0-9]*')" || true
  [ -z "$local_digest" ] && { echo "unknown"; return; }

  local token
  token="$(curl -sf --max-time 5 \
    "https://ghcr.io/token?scope=repository:imironru/didaticon-glue:pull&service=ghcr.io" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4)" || { echo "unknown"; return; }
  [ -z "$token" ] && { echo "unknown"; return; }

  local remote_digest
  remote_digest="$(curl -sf --max-time 5 \
    -H "Authorization: Bearer $token" \
    -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
    --head "https://ghcr.io/v2/imironru/didaticon-glue/manifests/latest" \
    | grep -i '^docker-content-digest:' | awk '{print $2}' | tr -d '\r\n')" || { echo "unknown"; return; }
  [ -z "$remote_digest" ] && { echo "unknown"; return; }

  [ "$local_digest" = "$remote_digest" ] && echo "uptodate" || echo "available"
}

# ── Главное меню ─────────────────────────────────────────────────────────────
main_menu() {
  local inst upd domain=""

  printf "  ${DIM}Проверяем статус...${NC}"
  inst="$(_install_status)"
  if [ "$inst" = "installed" ]; then
    upd="$(_update_status)"
    local dir; dir="$(_find_install_dir)"
    domain="$(_env_get EIOS_DOMAIN "${dir}/.env" 2>/dev/null || true)"
  else
    upd="unknown"
  fi
  printf "\r\033[K"

  echo
  echo -e "${CYAN}${BOLD}  ▶  ЭИОС Didaticon — управление${NC}"
  echo -e "${CYAN}  ──────────────────────────────────────────${NC}"
  echo

  if [ "$inst" = "installed" ]; then
    echo -e "  Статус: ${GREEN}установлен${NC}${domain:+  ·  ${BOLD}https://${domain}${NC}}"
  else
    echo -e "  Статус: ${DIM}не установлен${NC}"
  fi
  echo

  if [ "$inst" = "not_installed" ]; then
    echo -e "  ${BOLD}1.${NC}  Установить"
    echo -e "  ${DIM}2.  Обновить          — сначала установите${NC}"
    echo -e "  ${DIM}3.  Настройки         — сначала установите${NC}"
    echo -e "  ${DIM}4.  Удалить           — не установлено${NC}"
  else
    echo -e "  ${DIM}1.  Установить        — уже установлено${NC}"
    case "$upd" in
      available) echo -e "  ${BOLD}2.${NC}  Обновить          ${ORANGE}↑ доступно обновление${NC}" ;;
      uptodate)  echo -e "  ${DIM}2.  Обновить          — актуальная версия${NC}" ;;
      *)         echo -e "  ${BOLD}2.${NC}  Обновить" ;;
    esac
    echo -e "  ${BOLD}3.${NC}  Настройки         ${DIM}(домен, Univerkon, токен)${NC}"
    echo -e "  ${BOLD}4.${NC}  Удалить"
  fi

  echo
  echo -e "  ${BOLD}0.${NC}  Выход"
  echo
  echo -e "${CYAN}  ──────────────────────────────────────────${NC}"
  echo

  local choice
  read -rp "  Введите номер: " choice
  case "$choice" in
    1)
      if [ "$inst" = "installed" ]; then
        warn "Уже установлен. Для переустановки сначала удалите (пункт 4)."
        echo; read -rp "  Нажмите Enter..." _; main_menu
      else do_install; fi ;;
    2)
      if [ "$inst" = "not_installed" ]; then
        err "ЭИОС не установлен."; echo; read -rp "  Нажмите Enter..." _; main_menu
      elif [ "$upd" = "uptodate" ]; then
        log "Уже актуальная версия — обновление не требуется."
        echo; read -rp "  Нажмите Enter..." _; main_menu
      else do_update; fi ;;
    3)
      if [ "$inst" = "not_installed" ]; then
        err "ЭИОС не установлен."; echo; read -rp "  Нажмите Enter..." _; main_menu
      else do_settings; fi ;;
    4)
      if [ "$inst" = "not_installed" ]; then
        err "ЭИОС не установлен."; echo; read -rp "  Нажмите Enter..." _; main_menu
      else do_uninstall; fi ;;
    0|"") echo "  До свидания."; rm -f "$LOG_FILE"; exit 0 ;;
    *) err "Неверный выбор."; echo; read -rp "  Нажмите Enter..." _; main_menu ;;
  esac
}

# ── Установка ─────────────────────────────────────────────────────────────────
do_install() {
  echo
  echo -e "${CYAN}${BOLD}  ▶  Установка ЭИОС Didaticon${NC}"
  echo -e "${CYAN}  ──────────────────────────────────────────${NC}"
  echo

  # ── Проверка ОС
  local OS_ID OS_VER
  OS_ID="$(. /etc/os-release 2>/dev/null && echo "$ID" || echo unknown)"
  OS_VER="$(. /etc/os-release 2>/dev/null && echo "$VERSION_ID" || echo 0)"
  case "$OS_ID" in
    ubuntu) [ "${OS_VER%%.*}" -ge 20 ] 2>/dev/null || { err "Требуется Ubuntu 20.04+"; exit 1; } ;;
    debian) [ "${OS_VER%%.*}" -ge 11 ] 2>/dev/null || { err "Требуется Debian 11+"; exit 1; } ;;
    *) warn "Непроверенная ОС: $OS_ID $OS_VER" ;;
  esac

  # ── Сбор параметров
  echo -e "  ${YELLOW}Параметры подключения к Univerkon (1С).${NC}"
  echo -e "  ${DIM}Нет Univerkon — оставьте пустым для тестового режима (mock).${NC}"
  echo

  local EIOS_DOMAIN OIDC_ISSUER OIDC_JWKS_URL UNIVERKON_RPC_URL UNIVERKON_SERVICE_TOKEN USE_MOCK="n"

  while true; do
    read -rp "  Домен ЭИОС (например: eios.school.ru): " EIOS_DOMAIN
    [ -n "$EIOS_DOMAIN" ] && break
    warn "Домен обязателен."
  done

  echo
  read -rp "  URL OIDC Univerkon (Enter — тестовый mock): " OIDC_ISSUER
  if [ -z "$OIDC_ISSUER" ]; then
    USE_MOCK="y"
    OIDC_ISSUER="http://localhost:9000"
    OIDC_JWKS_URL="http://localhost:9000/jwks"
    UNIVERKON_RPC_URL="http://localhost:9000/rpc"
    UNIVERKON_SERVICE_TOKEN="mock-service-token"
    warn "Будет запущен локальный mock Univerkon — только для тестирования!"
  else
    OIDC_JWKS_URL="${OIDC_ISSUER}/.well-known/jwks.json"
    read -rp "  URL JWKS [${OIDC_JWKS_URL}]: " v
    OIDC_JWKS_URL="${v:-$OIDC_JWKS_URL}"
    read -rp "  URL JSON-RPC Univerkon: " UNIVERKON_RPC_URL
    read -rsp "  Сервисный токен Univerkon: " UNIVERKON_SERVICE_TOKEN; echo
  fi

  echo
  echo -e "${CYAN}  ┌─ Параметры установки ─────────────────${NC}"
  echo -e "  │  Домен:          ${BOLD}${EIOS_DOMAIN}${NC}"
  echo -e "  │  OIDC:           ${BOLD}${OIDC_ISSUER}${NC}"
  echo -e "  │  Univerkon RPC:  ${BOLD}${UNIVERKON_RPC_URL}${NC}"
  echo -e "  │  Mock-режим:     ${BOLD}$( [ "$USE_MOCK" = "y" ] && echo "да (тест)" || echo "нет (прод)" )${NC}"
  echo -e "${CYAN}  └───────────────────────────────────────${NC}"
  echo

  local CONFIRM
  read -rp "  Начать установку? [Enter / n]: " CONFIRM
  [[ "${CONFIRM:-y}" =~ ^[Nn] ]] && { echo "  Отмена."; main_menu; return; }

  echo; step "Установка. Лог: $LOG_FILE"; echo

  # ── Docker
  if ! command -v docker >/dev/null 2>&1; then
    run_spin "Устанавливаем Docker" bash -c \
      "curl -fsSL https://get.docker.com | sh && \
       usermod -aG docker '${SUDO_USER:-$USER}' 2>/dev/null || true"
  fi
  local DC; DC="$(_detect_dc)"; log "Docker готов"

  # ── Каталог установки + файлы compose (без git!)
  mkdir -p "$INSTALL_DIR"
  cd "$INSTALL_DIR"

  run_spin "Скачиваем compose-файлы" bash -c "
    curl -fsSL '${RAW}/docker-compose.yml'      -o docker-compose.yml &&
    curl -fsSL '${RAW}/docker-compose.prod.yml' -o docker-compose.prod.yml &&
    curl -fsSL '${RAW}/Caddyfile'               -o Caddyfile &&
    curl -fsSL '${RAW}/.env.example'            -o .env.example
  "

  # ── .env
  cp .env.example .env
  _env_set EIOS_DOMAIN             "$EIOS_DOMAIN"             .env
  _env_set OIDC_ISSUER             "$OIDC_ISSUER"             .env
  _env_set OIDC_JWKS_URL           "$OIDC_JWKS_URL"           .env
  _env_set OIDC_AUDIENCE           "eios-glue"                .env
  _env_set UNIVERKON_RPC_URL       "$UNIVERKON_RPC_URL"        .env
  _env_set UNIVERKON_SERVICE_TOKEN "$UNIVERKON_SERVICE_TOKEN"  .env
  _env_set EIOS_STORE              "sqlite"                    .env
  _env_set EIOS_SQLITE_PATH        "/data/glue.sqlite"         .env
  _env_set EIOS_ROLE               "central"                   .env
  _env_set PORT                    "8080"                      .env
  _env_set POSTGRES_PASSWORD \
    "$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)" .env
  _env_set GITHUB_REPOSITORY_OWNER "imironru"                  .env
  log ".env создан"

  # glue читает свой .env отдельно — кладём рядом
  mkdir -p glue && cp .env glue/.env

  # ── Mock (тестовый режим) — нужен Node.js только для него
  if [ "$USE_MOCK" = "y" ]; then
    run_spin "Устанавливаем Node.js (для mock)" bash -c \
      "curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
       apt-get install -y -qq nodejs"
    # Скачиваем только mock + минимальный package.json
    mkdir -p mock
    run_spin "Скачиваем mock" bash -c "
      curl -fsSL '${RAW}/mock/univerkon.ts' -o mock/univerkon.ts &&
      curl -fsSL '${RAW}/package.json'      -o package.json &&
      npm install --omit=dev 2>/dev/null || npm install
    "
    if command -v systemctl >/dev/null 2>&1 && [ -d /etc/systemd/system ]; then
      cat > /etc/systemd/system/eios-mock.service <<UNIT
[Unit]
Description=ЭИОС mock Univerkon
After=network.target
[Service]
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/npx tsx mock/univerkon.ts
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
      systemctl daemon-reload
      systemctl enable --now eios-mock >> "$LOG_FILE" 2>&1
      log "Mock Univerkon запущен как сервис (порт 9000)"
    else
      nohup npx tsx mock/univerkon.ts >> "$LOG_FILE" 2>&1 &
      log "Mock Univerkon запущен в фоне (порт 9000)"
    fi
  fi

  # ── Образы + запуск
  local DCC; DCC="$(_dc_cmd "$INSTALL_DIR")"
  run_spin "Скачиваем образы из ghcr.io" bash -c "$DCC pull"
  run_spin "Запускаем ЭИОС" bash -c "$DCC up -d"

  # ── Ждём Caddy / HTTPS
  printf "  ${CYAN}⠋${NC}  Ждём HTTPS (%s)..." "$EIOS_DOMAIN"
  local OK=0
  for i in $(seq 1 30); do
    curl -fsS "https://${EIOS_DOMAIN}/api/healthz" >> "$LOG_FILE" 2>&1 && { OK=1; break; }; sleep 3
  done
  if [ "$OK" = "1" ]; then
    printf "\r  ${GREEN}✓${NC}  HTTPS готов   \n"
  else
    printf "\r  ${YELLOW}!${NC}  HTTPS не ответил — DNS может ещё не резолвиться\n"
    printf "  ${DIM}  Проверьте: $DCC logs caddy${NC}\n"
  fi

  local HOST_IP
  HOST_IP="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' || echo '<IP>')"

  echo
  echo -e "${GREEN}${BOLD}  ✓  ЭИОС Didaticon установлен!${NC}"
  echo -e "${GREEN}  ──────────────────────────────────────────${NC}"
  echo -e "  ${BOLD}URL:${NC}         ${GREEN}https://${EIOS_DOMAIN}${NC}"
  echo -e "  ${BOLD}IP сервера:${NC}  ${HOST_IP}"
  if [ "$USE_MOCK" = "y" ]; then
    echo
    echo -e "  ${YELLOW}Тестовый режим: вход автоматический (student-001).${NC}"
    echo -e "  ${YELLOW}Для прода замените OIDC на реальный Univerkon (пункт 3 → Настройки).${NC}"
  fi
  echo -e "${GREEN}  ──────────────────────────────────────────${NC}"
  echo -e "  ${DIM}Управление:  bash ${INSTALL_DIR}/manage.sh${NC}"
  echo
  # Сохраняем manage.sh рядом с compose
  cp "${BASH_SOURCE[0]}" "${INSTALL_DIR}/manage.sh" 2>/dev/null || \
    curl -fsSL "${RAW}/manage.sh" -o "${INSTALL_DIR}/manage.sh"
  chmod +x "${INSTALL_DIR}/manage.sh"
  rm -f "$LOG_FILE"
}

# ── Обновление ────────────────────────────────────────────────────────────────
do_update() {
  local dir; dir="$(_find_install_dir)"
  local DCC; DCC="$(_dc_cmd "$dir")"

  echo
  echo -e "${CYAN}${BOLD}  ▶  Обновление ЭИОС Didaticon${NC}"
  echo -e "${CYAN}  ──────────────────────────────────────────${NC}"
  echo

  cd "$dir"

  # Обновляем только compose-файлы (не .env — там настройки пользователя)
  run_spin "Обновляем compose-файлы" bash -c "
    curl -fsSL '${RAW}/docker-compose.yml'      -o docker-compose.yml &&
    curl -fsSL '${RAW}/docker-compose.prod.yml' -o docker-compose.prod.yml &&
    curl -fsSL '${RAW}/Caddyfile'               -o Caddyfile
  "

  run_spin "Скачиваем новые образы" bash -c "$DCC pull"
  run_spin "Перезапускаем сервисы" bash -c "$DCC up -d --remove-orphans"

  local domain; domain="$(_env_get EIOS_DOMAIN "${dir}/.env")"
  printf "  ${CYAN}⠋${NC}  Проверяем healthz..."
  local OK=0
  for i in $(seq 1 20); do
    curl -fsS "https://${domain}/api/healthz" >> "$LOG_FILE" 2>&1 && { OK=1; break; }; sleep 3
  done
  [ "$OK" = "1" ] && printf "\r  ${GREEN}✓${NC}  Сервис отвечает   \n" \
                  || printf "\r  ${YELLOW}!${NC}  Нет ответа — проверьте: $DCC logs\n"

  # Обновляем сам manage.sh
  curl -fsSL "${RAW}/manage.sh" -o "${dir}/manage.sh" && chmod +x "${dir}/manage.sh" \
    && log "manage.sh обновлён" || true

  echo
  echo -e "${GREEN}${BOLD}  ✓  ЭИОС обновлён.${NC}"
  echo
  rm -f "$LOG_FILE"
}

# ── Настройки ────────────────────────────────────────────────────────────────
do_settings() {
  local dir; dir="$(_find_install_dir)"
  local DCC; DCC="$(_dc_cmd "$dir")"
  local env="${dir}/.env"

  settings_menu() {
    echo
    echo -e "${CYAN}${BOLD}  ▶  Настройки ЭИОС${NC}"
    echo -e "${CYAN}  ──────────────────────────────────────────${NC}"
    echo

    local domain;  domain="$(_env_get EIOS_DOMAIN "$env")"
    local oidc;    oidc="$(_env_get OIDC_ISSUER "$env")"
    local rpc;     rpc="$(_env_get UNIVERKON_RPC_URL "$env")"
    local tok_set; [ -n "$(_env_get UNIVERKON_SERVICE_TOKEN "$env")" ] \
      && tok_set="${GREEN}задан${NC}" || tok_set="${YELLOW}не задан${NC}"

    echo -e "  ${BOLD}1.${NC}  Домен              ${DIM}${domain}${NC}"
    echo -e "  ${BOLD}2.${NC}  OIDC Issuer        ${DIM}${oidc}${NC}"
    echo -e "  ${BOLD}3.${NC}  Univerkon RPC URL  ${DIM}${rpc}${NC}"
    echo -e "  ${BOLD}4.${NC}  Сервисный токен    $(echo -e "$tok_set")"
    echo
    echo -e "  ${BOLD}0.${NC}  Назад"
    echo
    echo -e "${CYAN}  ──────────────────────────────────────────${NC}"
    echo

    local sc
    read -rp "  Введите номер: " sc
    case "$sc" in
      1)
        local cur; cur="$(_env_get EIOS_DOMAIN "$env")"
        read -rp "  Новый домен [${cur}]: " v; v="${v:-$cur}"
        [ -z "$v" ] && { warn "Домен не может быть пустым."; settings_menu; return; }
        _env_set EIOS_DOMAIN "$v" "$env"
        log "Домен сохранён: $v"; _apply_settings "$dir" "$DCC"; settings_menu ;;
      2)
        local cur; cur="$(_env_get OIDC_ISSUER "$env")"
        read -rp "  OIDC Issuer [${cur}]: " v; v="${v:-$cur}"
        _env_set OIDC_ISSUER "$v" "$env"
        local cur_jwks; cur_jwks="$(_env_get OIDC_JWKS_URL "$env")"
        [[ "$cur_jwks" == "${cur}/.well-known/jwks.json" ]] && \
          _env_set OIDC_JWKS_URL "${v}/.well-known/jwks.json" "$env"
        log "OIDC Issuer сохранён: $v"; _apply_settings "$dir" "$DCC"; settings_menu ;;
      3)
        local cur; cur="$(_env_get UNIVERKON_RPC_URL "$env")"
        read -rp "  Univerkon RPC URL [${cur}]: " v; v="${v:-$cur}"
        _env_set UNIVERKON_RPC_URL "$v" "$env"
        log "RPC URL сохранён: $v"; _apply_settings "$dir" "$DCC"; settings_menu ;;
      4)
        read -rsp "  Новый сервисный токен: " v; echo
        [ -z "$v" ] && { warn "Токен не может быть пустым."; settings_menu; return; }
        _env_set UNIVERKON_SERVICE_TOKEN "$v" "$env"
        log "Токен сохранён"; _apply_settings "$dir" "$DCC"; settings_menu ;;
      0|"") main_menu ;;
      *) err "Неверный выбор."; settings_menu ;;
    esac
  }

  settings_menu
}

_apply_settings() {
  local dir="$1" DCC="$2"
  cp "${dir}/.env" "${dir}/glue/.env"
  printf "  ${CYAN}⠋${NC}  Перезапускаем glue..."
  (cd "$dir" && $DCC up -d glue) >> "$LOG_FILE" 2>&1
  printf "\r  ${GREEN}✓${NC}  Применено   \n"
}

# ── Удаление ─────────────────────────────────────────────────────────────────
do_uninstall() {
  local dir; dir="$(_find_install_dir)"
  local DCC; DCC="$(_dc_cmd "$dir")"

  echo
  echo -e "${RED}${BOLD}  ✗  Удаление ЭИОС Didaticon${NC}"
  echo -e "${RED}  ──────────────────────────────────────────${NC}"
  echo
  warn "Это действие остановит все контейнеры ЭИОС."
  echo

  local DEL_DATA DEL_IMAGES DEL_DIR
  read -rp "  Удалить данные SQLite (история сеансов, свидетельства)? [y/N]: " DEL_DATA;   DEL_DATA="${DEL_DATA:-n}"
  read -rp "  Удалить Docker-образы? [y/N]: "                                               DEL_IMAGES; DEL_IMAGES="${DEL_IMAGES:-n}"
  read -rp "  Удалить каталог ${dir}? [y/N]: "                                             DEL_DIR;    DEL_DIR="${DEL_DIR:-n}"

  echo
  local CONFIRM
  read -rp "  Подтвердить? [y/N]: " CONFIRM
  [[ "${CONFIRM:-n}" =~ ^[Yy] ]] || { echo "  Отмена."; main_menu; return; }
  echo

  cd "$dir"

  if [[ "$DEL_DATA" =~ ^[Yy] ]]; then
    run_spin "Останавливаем (с удалением volumes)" bash -c "$DCC down -v"
  else
    run_spin "Останавливаем контейнеры" bash -c "$DCC down"
  fi

  [[ "$DEL_IMAGES" =~ ^[Yy] ]] && \
    run_spin "Удаляем образы" bash -c \
      "docker rmi '$GLUE_IMAGE' '$PWA_IMAGE' 2>/dev/null || true"

  if command -v systemctl >/dev/null 2>&1; then
    systemctl disable --now eios-mock 2>/dev/null || true
    rm -f /etc/systemd/system/eios-mock.service
    systemctl daemon-reload 2>/dev/null || true
  fi

  if [[ "$DEL_DIR" =~ ^[Yy] ]]; then
    cd /tmp && rm -rf "$dir" && log "Каталог удалён"
  fi

  echo
  echo -e "${GREEN}${BOLD}  ✓  ЭИОС удалён.${NC}"
  echo
  rm -f "$LOG_FILE"
}

# ── Точка входа ───────────────────────────────────────────────────────────────
main_menu
