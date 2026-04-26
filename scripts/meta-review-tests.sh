#!/usr/bin/env bash
# =============================================================================
# Meta App Review – Script de Testes
# Faz todas as chamadas à API necessárias para aprovar a revisão da Meta.
#
# Uso:
#   chmod +x scripts/meta-review-tests.sh
#   ./scripts/meta-review-tests.sh
# =============================================================================

set -euo pipefail

# ─── Cores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔${NC} $*"; }
info() { echo -e "${BLUE}→${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
fail() { echo -e "${RED}✘${NC} $*"; }
sep()  { echo -e "\n${BLUE}────────────────────────────────────────${NC}"; }

# ─── Configuração ─────────────────────────────────────────────────────────────
BACKEND="${BACKEND_URL:-https://ai-adsbackend-production.up.railway.app}"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Meta App Review – Script de Testes de API      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backend: $BACKEND"
echo ""

# ─── 1. Login no backend ──────────────────────────────────────────────────────
sep
echo "PASSO 1 – Login no backend"
echo ""
read -rp "  Email: " USER_EMAIL
read -rsp "  Senha: " USER_PASS
echo ""

LOGIN_RESP=$(curl -sf -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\"}" 2>&1) || {
    fail "Falha ao conectar no backend. Verifique a URL e tente novamente."
    exit 1
  }

JWT=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$JWT" ]; then
  fail "Login falhou. Resposta: $LOGIN_RESP"
  exit 1
fi
ok "Autenticado com sucesso"

AUTH="Authorization: Bearer $JWT"

# ─── 2. Verificar integração Meta ─────────────────────────────────────────────
sep
echo "PASSO 2 – Verificar integração Meta"
echo ""

INTEGRACOES=$(curl -sf "$BACKEND/api/integracoes" -H "$AUTH")
META_CONECTADO=$(echo "$INTEGRACOES" | grep -o '"plataforma":"meta"[^}]*"conectado":true' || true)

if [ -z "$META_CONECTADO" ]; then
  warn "Conta Meta não conectada!"
  echo ""
  echo "  1. Acesse o app no navegador"
  echo "  2. Vá em Integrações → conecte sua conta Meta"
  echo "  3. Execute este script novamente"
  echo ""
  exit 1
fi
ok "Meta conectada"

# ─── 3. public_profile ────────────────────────────────────────────────────────
sep
echo "PASSO 3 – Testando: public_profile"
echo ""
info "GET /api/meta-ads/perfil"

PERFIL=$(curl -sf "$BACKEND/api/meta-ads/perfil" -H "$AUTH" 2>&1) || {
  fail "Endpoint /api/meta-ads/perfil não disponível. Certifique-se que o deploy foi feito."
  PERFIL=""
}
if [ -n "$PERFIL" ]; then
  NOME=$(echo "$PERFIL" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  ok "Perfil obtido: $NOME"
fi

# ─── 4. pages_show_list + pages_read_engagement ───────────────────────────────
sep
echo "PASSO 4 – Testando: pages_show_list / pages_read_engagement"
echo ""
info "GET /api/meta-ads/paginas"

PAGINAS=$(curl -sf "$BACKEND/api/meta-ads/paginas" -H "$AUTH" 2>&1) || PAGINAS="[]"
NUM_PAGINAS=$(echo "$PAGINAS" | grep -o '"id"' | wc -l)
ok "Páginas encontradas: $NUM_PAGINAS"

# Pega ID da primeira página (para o teste de leads)
PAGE_ID=$(echo "$PAGINAS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

# ─── 5. Listar contas de anúncio ──────────────────────────────────────────────
sep
echo "PASSO 5 – Listando contas de anúncio"
echo ""
info "GET /api/integracoes/meta/contas"

CONTAS=$(curl -sf "$BACKEND/api/integracoes/meta/contas" -H "$AUTH" 2>&1) || CONTAS="[]"
ACCOUNT_ID=$(echo "$CONTAS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
ACCOUNT_NAME=$(echo "$CONTAS" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

if [ -z "$ACCOUNT_ID" ]; then
  warn "Nenhuma conta de anúncio encontrada. Selecione uma conta no app e tente novamente."
else
  ok "Conta: $ACCOUNT_NAME ($ACCOUNT_ID)"
fi

# ─── 6. ads_management – Criar campanha ───────────────────────────────────────
sep
echo "PASSO 6 – Testando: ads_management (criar campanha)"
echo ""
info "POST /api/meta-ads/campanhas"

CAMPANHA=$(curl -sf -X POST "$BACKEND/api/meta-ads/campanhas" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "name": "Review Test Campaign - '$(date +%Y%m%d%H%M)'",
    "objective": "OUTCOME_AWARENESS",
    "status": "PAUSED",
    "special_ad_categories": []
  }' 2>&1) || CAMPANHA=""

CAMPAIGN_ID=$(echo "$CAMPANHA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
if [ -n "$CAMPAIGN_ID" ]; then
  ok "Campanha criada: $CAMPAIGN_ID"
else
  warn "Não foi possível criar campanha. Resposta: $CAMPANHA"
  warn "Você pode já ter campanhas existentes – continuando..."
fi

# ─── 7. Listar campanhas existentes ───────────────────────────────────────────
info "GET /api/meta-ads/campanhas"
LISTA_CAMP=$(curl -sf "$BACKEND/api/meta-ads/campanhas" -H "$AUTH" 2>&1) || LISTA_CAMP="[]"
NUM_CAMP=$(echo "$LISTA_CAMP" | grep -o '"id"' | wc -l)
ok "Total de campanhas: $NUM_CAMP"

# Usa campanha criada ou pega a primeira existente
if [ -z "$CAMPAIGN_ID" ]; then
  CAMPAIGN_ID=$(echo "$LISTA_CAMP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
fi

# ─── 8. ads_management – Criar ad set ────────────────────────────────────────
sep
echo "PASSO 7 – Testando: ads_management (criar conjunto de anúncio)"
echo ""

if [ -n "$CAMPAIGN_ID" ] && [ -n "$ACCOUNT_ID" ]; then
  info "POST /api/meta-ads/adsets"
  ADSET=$(curl -sf -X POST "$BACKEND/api/meta-ads/adsets" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{
      "name": "Review Test AdSet - '$(date +%Y%m%d%H%M)'",
      "campaign_id": "'"$CAMPAIGN_ID"'",
      "daily_budget": 500,
      "billing_event": "IMPRESSIONS",
      "optimization_goal": "REACH",
      "targeting": { "geo_locations": { "countries": ["BR"] }, "age_min": 18, "age_max": 65 },
      "status": "PAUSED"
    }' 2>&1) || ADSET=""

  ADSET_ID=$(echo "$ADSET" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
  if [ -n "$ADSET_ID" ]; then
    ok "Conjunto de anúncio criado: $ADSET_ID"
  else
    warn "Não foi possível criar ad set. Resposta: $ADSET"
    ADSET_ID=$(curl -sf "$BACKEND/api/meta-ads/adsets?campaign_id=$CAMPAIGN_ID" -H "$AUTH" 2>&1 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
  fi

  info "GET /api/meta-ads/adsets?campaign_id=$CAMPAIGN_ID"
  LISTA_ADSETS=$(curl -sf "$BACKEND/api/meta-ads/adsets?campaign_id=$CAMPAIGN_ID" -H "$AUTH" 2>&1) || LISTA_ADSETS="[]"
  NUM_ADSETS=$(echo "$LISTA_ADSETS" | grep -o '"id"' | wc -l)
  ok "Total de conjuntos: $NUM_ADSETS"
else
  warn "Pulando criação de ad set (sem campanha ou conta disponível)"
fi

# ─── 9. Criar criativo ────────────────────────────────────────────────────────
sep
echo "PASSO 8 – Testando: pages_manage_ads (criar criativo)"
echo ""

if [ -n "$ACCOUNT_ID" ] && [ -n "$PAGE_ID" ]; then
  info "POST /api/meta-ads/criativos"
  CRIATIVO=$(curl -sf -X POST "$BACKEND/api/meta-ads/criativos" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{
      "name": "Review Test Creative - '$(date +%Y%m%d%H%M)'",
      "object_story_spec": {
        "page_id": "'"$PAGE_ID"'",
        "link_data": {
          "message": "Teste de revisão do app Meta",
          "link": "https://example.com",
          "name": "Título do Anúncio de Teste"
        }
      }
    }' 2>&1) || CRIATIVO=""

  CREATIVE_ID=$(echo "$CRIATIVO" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
  if [ -n "$CREATIVE_ID" ]; then
    ok "Criativo criado: $CREATIVE_ID"
  else
    warn "Não foi possível criar criativo. Resposta: $CRIATIVO"
  fi

  info "GET /api/meta-ads/criativos"
  curl -sf "$BACKEND/api/meta-ads/criativos" -H "$AUTH" > /dev/null 2>&1 && ok "Listagem de criativos OK" || warn "Falha ao listar criativos"
else
  warn "Pulando criativo (sem page_id disponível)"
fi

# ─── 10. Criar anúncio ────────────────────────────────────────────────────────
sep
echo "PASSO 9 – Criar anúncio final"
echo ""

if [ -n "$ADSET_ID" ] && [ -n "$CREATIVE_ID" ]; then
  info "POST /api/meta-ads/anuncios"
  ANUNCIO=$(curl -sf -X POST "$BACKEND/api/meta-ads/anuncios" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{
      "name": "Review Test Ad - '$(date +%Y%m%d%H%M)'",
      "adset_id": "'"$ADSET_ID"'",
      "creative": { "creative_id": "'"$CREATIVE_ID"'" },
      "status": "PAUSED"
    }' 2>&1) || ANUNCIO=""

  AD_ID=$(echo "$ANUNCIO" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
  if [ -n "$AD_ID" ]; then
    ok "Anúncio criado: $AD_ID"
  else
    warn "Não foi possível criar anúncio. Resposta: $ANUNCIO"
  fi
else
  warn "Pulando criação de anúncio (faltam ad set ou criativo)"
fi

# ─── 11. Insights (desempenho) ────────────────────────────────────────────────
sep
echo "PASSO 10 – Testando: ads_read (métricas de desempenho)"
echo ""
info "GET /api/meta-ads/insights?level=campaign&date_preset=last_30d"

INSIGHTS=$(curl -sf "$BACKEND/api/meta-ads/insights?level=campaign&date_preset=last_30d" -H "$AUTH" 2>&1) || INSIGHTS="[]"
NUM_INS=$(echo "$INSIGHTS" | grep -o '"impressions"' | wc -l)
ok "Insights obtidos: $NUM_INS registros"

info "GET /api/meta-ads/insights?level=account&date_preset=last_7d"
curl -sf "$BACKEND/api/meta-ads/insights?level=account&date_preset=last_7d" -H "$AUTH" > /dev/null 2>&1 && ok "Insights de conta OK" || warn "Falha nos insights de conta"

# ─── 12. Leads ────────────────────────────────────────────────────────────────
sep
echo "PASSO 11 – Testando: leads_retrieval (formulários de lead)"
echo ""

if [ -n "$PAGE_ID" ]; then
  info "GET /api/meta-ads/leads/formularios?page_id=$PAGE_ID"
  FORMS=$(curl -sf "$BACKEND/api/meta-ads/leads/formularios?page_id=$PAGE_ID" -H "$AUTH" 2>&1) || FORMS="[]"
  NUM_FORMS=$(echo "$FORMS" | grep -o '"id"' | wc -l)
  ok "Formulários encontrados: $NUM_FORMS"

  if [ "$NUM_FORMS" -gt 0 ]; then
    FORM_ID=$(echo "$FORMS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
    info "GET /api/meta-ads/leads/$FORM_ID"
    LEADS=$(curl -sf "$BACKEND/api/meta-ads/leads/$FORM_ID" -H "$AUTH" 2>&1) || LEADS="[]"
    NUM_LEADS=$(echo "$LEADS" | grep -o '"id"' | wc -l)
    ok "Leads encontrados: $NUM_LEADS"
  fi
else
  warn "Pulando leads (sem página disponível)"
fi

# ─── Resumo ───────────────────────────────────────────────────────────────────
sep
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Testes concluídos!                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Aguarde até 24h para a Meta processar as chamadas"
echo "  2. Volte ao painel Meta for Developers → Teste"
echo "  3. Verifique se as permissões mudaram para 'Concluída'"
echo "  4. Se alguma ainda não concluiu, execute o script novamente"
echo ""
echo "Painel Meta: https://developers.facebook.com/apps"
echo ""
