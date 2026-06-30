#!/usr/bin/env bash
# Управляет chaos-конфигурацией.
# Примеры:
#   ./scripts/chaos.sh --latency 200 500         # задержка 200-500ms
#   ./scripts/chaos.sh --error-rate 0.3          # 30% ошибок 503
#   ./scripts/chaos.sh --error-method schedule.get
#   ./scripts/chaos.sh --reset

MOCK_URL="${MOCK_URL:-http://localhost:9000}"
MOCK_ADMIN_TOKEN="${MOCK_ADMIN_TOKEN:-mock-admin-dev}"

if [[ "$1" == "--reset" ]]; then
  curl -sf -X DELETE "${MOCK_URL}/admin/chaos" \
    -H "Authorization: Bearer ${MOCK_ADMIN_TOKEN}" | python3 -c "import sys,json; print('chaos reset:', json.load(sys.stdin))"
  exit 0
fi

if [[ "$1" == "--latency" ]]; then
  curl -sf -X POST "${MOCK_URL}/admin/chaos" \
    -H "Authorization: Bearer ${MOCK_ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"latency\":{\"min\":${2},\"max\":${3}}}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('chaos:', json.dumps(d.get('chaos', {})))"
  exit 0
fi

if [[ "$1" == "--error-rate" ]]; then
  curl -sf -X POST "${MOCK_URL}/admin/chaos" \
    -H "Authorization: Bearer ${MOCK_ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"error_rate\":${2}}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('chaos:', json.dumps(d.get('chaos', {})))"
  exit 0
fi

if [[ "$1" == "--error-method" ]]; then
  curl -sf -X POST "${MOCK_URL}/admin/chaos" \
    -H "Authorization: Bearer ${MOCK_ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"error_methods\":[\"${2}\"],\"error_rate\":1.0}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('chaos:', json.dumps(d.get('chaos', {})))"
  exit 0
fi

# По умолчанию — показать текущий конфиг
curl -sf "${MOCK_URL}/admin/chaos" \
  -H "Authorization: Bearer ${MOCK_ADMIN_TOKEN}" \
  | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))"
