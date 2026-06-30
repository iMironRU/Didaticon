#!/usr/bin/env bash
# Загружает сценарий: ./scripts/scenario.sh student-with-debts
# Переменные: MOCK_URL (default http://localhost:9000), MOCK_ADMIN_TOKEN

MOCK_URL="${MOCK_URL:-http://localhost:9000}"
MOCK_ADMIN_TOKEN="${MOCK_ADMIN_TOKEN:-mock-admin-dev}"
SCENARIO="${1:-default}"

curl -sf -X POST "${MOCK_URL}/admin/scenarios/${SCENARIO}/load" \
  -H "Authorization: Bearer ${MOCK_ADMIN_TOKEN}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Active:', d.get('active', {}).get('id', '?'))"
