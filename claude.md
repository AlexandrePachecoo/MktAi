# CLAUDE.md — AI Ads Platform

Arquivo de contexto arquitetural para o Claude Code. Leia antes de qualquer decisão técnica.

---

## O que é esse projeto

Plataforma SaaS com IA para gerenciar campanhas no Meta Ads e Google Ads. Gera estratégias, criativos e testes A/B — e otimiza orçamentos automaticamente a cada hora via fila de jobs. Público-alvo: criadores de SaaS, indie hackers e desenvolvedores.

---

## Requisitos Funcionais

- Usuário conecta suas contas do Meta Ads e Google Ads via OAuth
- Usuário preenche nome, descrição, objetivo e público-alvo da campanha
- IA gera uma estratégia de marketing com distribuição de anúncios e 5 opções de copies
- IA otimiza campanhas a cada 1h e pode pausar/encerrar automaticamente
- Usuário faz upload dos próprios criativos (geração por IA fica para versão futura)
- Testes A/B entre dois criativos de uma mesma campanha

---

## Stack Definida

| Camada | Tecnologia |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Testes | Jest |
| Banco de dados | PostgreSQL (Supabase) |
| ORM | Prisma |
| IA | OpenAI gpt-4o-mini (estratégia e otimização) |
| Fila de jobs | BullMQ + Redis (Docker local) |
| Object Storage | Supabase Storage (bucket: `criativos`, público) |

---

## Infraestrutura Local

- **Redis**: rodando via Docker — `docker run -d --name redis-mktai -p 6379:6379 redis:alpine`
- **Banco**: Supabase PostgreSQL — host `db.xtipntxpzqcgmwwdahcm.supabase.co`
- **Storage**: Supabase Storage — projeto `gvonjsdrbtrftxmqimkw`

---

## Decisões Arquiteturais

### Monolito Modular (não microserviços)
O projeto começa como um monolito modular. Os módulos são separados internamente mas rodam no mesmo processo Node.js. Não extrair para microserviços até atingir escala que justifique a complexidade.

### Monorepo com npm workspaces
```
ai-ads-platform/
├── packages/
│   ├── frontend/   (React)
│   └── backend/    (Express)
├── package.json
└── CLAUDE.md
```

### Next.js NÃO é usado no backend
Next.js é usado apenas se necessário no frontend. O backend é Express puro — as API Routes do Next.js não suportam BullMQ/Redis pois rodam como funções serverless sem estado persistente.

### Métricas não são salvas no banco
As métricas de campanhas são buscadas em tempo real diretamente nas APIs do Meta/Google. Não há entidade de métricas no banco de dados.

### Logs de otimização da IA não são salvos
Os resultados das análises do worker (status, motivo, sugestões) ficam apenas no `console.log`. Não salvar em banco por decisão do produto.

### Migrations via prisma db push (não migrate dev)
O `prisma migrate dev` requer terminal interativo. Usar sempre `npx prisma db push --accept-data-loss` para aplicar mudanças de schema.

### Criativos gerados por IA estão desabilitados por ora
Usuário faz upload dos próprios criativos. DALL-E fica para versão futura. `tipo` no banco pode ser `upload` ou `gerado_ia`.

---

## Modelo de Dados

### User
```
id, nome, email, hash_pass, plano, created_at
```

### Campanha
```
id, user_id, nome, descricao, objetivo, publico_alvo, orcamento, plataforma, status, estrategia (Json?), created_at
```
- `plataforma`: meta | google | ambos
- `status`: ativa | pausada | encerrada
- `estrategia`: JSON gerado pela IA com resumo, distribuição e copies (nullable)
- `objetivo`: texto livre (ex: "conversao", "awareness", "leads")

### Criativo
```
id, campanha_id, url_imagem, tipo, created_at
```
- `tipo`: upload | gerado_ia
- `url_imagem`: URL pública no Supabase Storage

### TesteAB
```
id, campanha_id, criativo_id_a, criativo_id_b, resultado, status
```
- `status`: ativo | encerrado
- `resultado`: texto livre indicando o vencedor

### Integracao
```
id, user_id, plataforma, access_token, refresh_token, expires_at
@@unique([user_id, plataforma])
```

---

## Endpoints da API implementados

### Auth
```
POST /auth/register   → { nome, email, password }
POST /auth/login      → { email, password } → { token, user }
```

### Integrações OAuth
```
GET /integracoes/meta              → redireciona para OAuth do Meta
GET /integracoes/meta/callback     → salva token no banco
GET /integracoes/google            → redireciona para OAuth do Google
GET /integracoes/google/callback   → salva token no banco
```

### Campanhas
```
GET    /campanhas
POST   /campanhas              → { nome, descricao, objetivo, publico_alvo, orcamento, plataforma }
GET    /campanhas/:id
PUT    /campanhas/:id
DELETE /campanhas/:id
POST   /campanhas/:id/estrategia  → IA gera estratégia com distribuição + 5 copies
```

### Criativos
```
POST /upload/upload                  → multipart/form-data, campo "imagem" → { url }
POST /campanhas/:id/criativos        → { url_imagem } → associa à campanha
GET  /campanhas/:id/criativos        → lista criativos
```

### Testes A/B
```
GET   /campanhas/:id/testes-ab
POST  /campanhas/:id/testes-ab                      → { criativo_id_a, criativo_id_b }
PATCH /campanhas/:id/testes-ab/:testeId/resultado   → { resultado } → encerra teste
```

### Dashboard
```
GET /dashboard/:campanha_id  → métricas em tempo real do Meta/Google
```

---

## Resposta da IA — Estratégia de Campanha

```json
{
  "resumo": "texto da estratégia",
  "distribuicao": [
    { "plataforma": "meta", "percentual": 60, "justificativa": "..." }
  ],
  "copies": [
    { "titulo": "...", "texto": "...", "formato": "stories" },
    ...
  ]
}
```
- Tempo de resposta médio: **3 a 8 segundos** (gpt-4o-mini)
- Salvo no campo `estrategia` da Campanha

---

## Fila de Jobs (BullMQ)

```
Servidor sobe → iniciarScheduler()
                     ↓
              Job recorrente a cada 1h
                     ↓
         enfileirarCampanhasAtivas() → busca todas com status "ativa"
                     ↓
         optimizationQueue.addBulk() → 1 job por campanha
                     ↓
         optimizationWorker (concurrency: 5)
                     ↓
         OpenAI analisa → "otimizada" | "pausar" | "encerrar"
                     ↓
         Atualiza status no banco se necessário
```

- Worker em `src/queue/optimization.worker.ts`
- Scheduler em `src/queue/optimization.scheduler.ts`
- Fila em `src/queue/optimization.queue.ts`
- Tempo médio por campanha: **2 a 4 segundos**

---

## Dashboard — Métricas

- Meta: `impressoes, cliques, gasto, alcance, ctr, cpc`
- Google: `impressoes, cliques, gasto, ctr, cpc`
- Se integração não estiver conectada, retorna `{ "erro": "..." }` dentro da chave da plataforma sem derrubar o endpoint
- Google Ads requer `GOOGLE_ADS_DEVELOPER_TOKEN` no `.env`

---

## Variáveis de Ambiente (.env)

```
DATABASE_URL
JWT_SECRET
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_ADS_DEVELOPER_TOKEN   # necessário para métricas do Google
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
REDIS_HOST
REDIS_PORT
OPENAI_API_KEY
```

---

## Arquitetura — Fluxo dos Dados

### Fluxo do usuário (síncrono)
```
Usuário → API Gateway (JWT) → Módulo → PostgreSQL
                                      → Supabase Storage (criativos)
```

### Fluxo da IA (assíncrono — a cada 1h)
```
Cron (1h) → BullMQ → Worker → OpenAI → PostgreSQL (atualiza status)
```

### Dashboard (síncrono — tempo real)
```
Usuário → Dashboard → Meta/Google Ads (direto, sem passar pela fila)
```

---

## O que NÃO fazer

- ❌ Não usar Next.js no backend
- ❌ Não salvar imagens no banco de dados
- ❌ Não salvar métricas no banco (buscar em tempo real)
- ❌ Não salvar logs de otimização da IA no banco
- ❌ Não extrair microserviços prematuramente
- ❌ Não usar `pg` diretamente — usar Prisma
- ❌ Não processar jobs de IA de forma síncrona no request do usuário
- ❌ Não criar funções sem testes — toda função nova deve ter teste correspondente
- ❌ Não usar `prisma migrate dev` (requer terminal interativo) — usar `prisma db push`
- ❌ Não gerar criativos com IA por enquanto — usuário faz upload
