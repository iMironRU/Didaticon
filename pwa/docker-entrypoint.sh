#!/bin/sh
# Генерирует /config.js из переменных окружения при каждом старте контейнера.
# Один образ — любой домен и OIDC.
cat > /usr/share/nginx/html/config.js << EOF
window.__EIOS_CONFIG__ = {
  oidcIssuer:   "${VITE_OIDC_ISSUER:-http://localhost:9000}",
  oidcClientId: "${VITE_OIDC_CLIENT_ID:-eios-pwa}",
  branding: {
    oidcEnabled: ${EIOS_OIDC_ENABLED:-false},
    orgName:     "${EIOS_ORG_NAME:-Образовательная организация}"
  }
};
EOF
exec nginx -g 'daemon off;'
