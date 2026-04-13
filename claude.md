# CLAUDE.md — AI Ads Platform

Arquivo de contexto arquitetural para o Claude Code. Leia antes de qualquer decisão técnica.

---

## O que é esse projeto

Plataforma SaaS com IA para gerenciar campanhas no Meta Ads e Google Ads. Gera estratégias, criativos e testes A/B — e otimiza orçamentos automaticamente a cada hora via fila de jobs. Público-alvo: criadores de SaaS, indie hackers e desenvolvedores.

---

## Requisitos Funcionais

- Usuário conecta suas contas do Meta Ads e Google Ads via OAuth e seleciona a conta de anúncios
- Usuário preenche nome, descrição, objetivo e público-alvo da campanha
- IA gera uma estratégia de marketing com distribuição de anúncios e 5 opções de copies
- IA otimiza campanhas a cada 1h e pode pausar/encerrar automaticamente
- Usuário faz upload dos próprios criativos ou gera com Ideogram AI
- Testes A/B entre dois criativos de uma mesma campanha

---

## Stack Definida

| Camada | Tecnologia |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Testes backend | Jest + ts-jest |
| Testes frontend | Vitest + @testing-library/react |
| Banco de dados | PostgreSQL (Supabase) |
| ORM | Prisma |
| IA estratégia/otimização | OpenAI gpt-4o-mini |
| IA geração de imagens | Ideogram AI (modelo V_2, aspect ratio 1:1) |
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

### Criativos gerados por IA via Ideogram
Integração com Ideogram AI ativa. O backend constrói o prompt completo a partir dos dados da campanha (nome, descrição, objetivo, público-alvo) + copy selecionada opcional + observações extras do usuário. A imagem é baixada do Ideogram e salva no Supabase Storage. `tipo` no banco: `upload` ou `gerado_ia`.

### OAuth — JWT no parâmetro state
Os callbacks OAuth do Meta e Google não recebem header `Authorization`. O JWT do usuário é embedado no parâmetro `state` da URL OAuth e verificado no callback. Após sucesso, redireciona para `FRONTEND_URL/integracoes?conectado=meta` (ou `?erro=meta`).

### Integrações — account_id obrigatório para métricas
Cada integração salva um `account_id` além do token OAuth:
- **Meta**: `act_XXXXXXX` — buscado automaticamente via `/me/adaccounts`
- **Google**: ID numérico — buscado via `customers:listAccessibleCustomers` + GAQL search para nome descritivo

O dashboard só busca métricas se `account_id` estiver salvo. Sem ele, retorna `{ erro: "Conta não configurada" }`.

### Google Ads API — versão v20
Usar sempre `v20` nas chamadas à Google Ads API. Versões v16–v19 foram descontinuadas (retornam 404). Quando a versão for atualizada no futuro, mudar em `integracoes.service.ts` e `dashboard.service.ts`.

### Google Ads Developer Token — modo de teste
O developer token em modo de teste só acessa contas de teste do Google Ads. Para produção, solicitar Basic Access em: Google Ads → Ferramentas → Central de API.

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
id, user_id, plataforma, access_token, refresh_token, expires_at, account_id
@@unique([user_id, plataforma])
```
- `account_id`: ID da conta de anúncios (Meta: `act_XXXXXXX`, Google: ID numérico sem hífens)

---

## Endpoints da API implementados

### Auth
```
POST /auth/register   → { nome, email, password }
POST /auth/login      → { email, password } → { token, user }
```

### Integrações
```
GET    /integracoes                        → lista Meta e Google com status + account_id
DELETE /integracoes/:plataforma            → desconecta integração
PATCH  /integracoes/:plataforma/conta      → { account_id } → salva conta de anúncios
GET    /integracoes/meta                   → retorna { url } para OAuth do Meta
GET    /integracoes/meta/callback          → callback OAuth, lê JWT do state, redireciona frontend
GET    /integracoes/meta/contas            → lista ad accounts via /me/adaccounts
GET    /integracoes/google                 → retorna { url } para OAuth do Google
GET    /integracoes/google/callback        → callback OAuth, lê JWT do state, redireciona frontend
GET    /integracoes/google/contas          → lista customers via listAccessibleCustomers + GAQL
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
POST /upload/upload                       → multipart/form-data, campo "imagem" → { url }
POST /campanhas/:id/criativos             → { url_imagem } → associa à campanha (tipo: upload)
GET  /campanhas/:id/criativos             → lista criativos
POST /campanhas/:id/criativos/gerar       → { copy_index?, extra? } → gera com Ideogram AI
```

### Testes A/B
```
GET   /campanhas/:id/testes-ab
POST  /campanhas/:id/testes-ab                      → { criativo_id_a, criativo_id_b }
PATCH /campanhas/:id/testes-ab/:testeId/resultado   → { resultado } → encerra teste
```

### Dashboard
```
GET /dashboard/:campanha_id  → métricas em tempo real do Meta/Google (requer account_id salvo)
```

---

## Geração de Criativos com Ideogram AI

O backend monta o prompt automaticamente a partir dos dados da campanha:
```
PRODUTO/MARCA, DESCRIÇÃO, OBJETIVO, PÚBLICO-ALVO
+ COPY DO ANÚNCIO (se copy_index informado)
+ OBSERVAÇÕES ADICIONAIS (se extra informado)
+ instruções de estilo visual fixas
```

O frontend envia apenas `{ copy_index?: number, extra?: string }`. O usuário pode:
1. Selecionar uma copy da estratégia (opcional)
2. Adicionar observações extras no textarea (opcional)
3. Clicar "Gerar imagem" — sem precisar editar o prompt

Fluxo: Ideogram API → download da imagem → upload Supabase Storage → salva Criativo com `tipo: gerado_ia`

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

- Meta: `impressoes, cliques, gasto, alcance, ctr, cpc` — usa `account_id` salvo na Integracao
- Google: `impressoes, cliques, gasto, ctr, cpc` — usa `account_id` salvo na Integracao
- Se integração não conectada ou `account_id` não configurado, retorna `{ "erro": "..." }` sem derrubar o endpoint

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
GOOGLE_ADS_DEVELOPER_TOKEN   # necessário para métricas e listagem de contas do Google
IDEOGRAM_API_KEY             # geração de criativos com IA
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
REDIS_HOST
REDIS_PORT
OPENAI_API_KEY
FRONTEND_URL                 # ex: http://localhost:5173 — usado no redirect pós-OAuth
```

---

## Arquitetura — Fluxo dos Dados

### Fluxo do usuário (síncrono)
```
Usuário → API Gateway (JWT) → Módulo → PostgreSQL
                                      → Supabase Storage (criativos)
```

### Fluxo OAuth
```
Usuário → GET /integracoes/:plataforma → { url }
       → redireciona para Meta/Google (JWT embedado no state)
       → callback extrai JWT do state → salva token no banco
       → redireciona para FRONTEND_URL/integracoes?conectado=:plataforma
```

### Fluxo da IA (assíncrono — a cada 1h)
```
Cron (1h) → BullMQ → Worker → OpenAI → PostgreSQL (atualiza status)
```

### Geração de criativo (síncrono)
```
Usuário → POST /campanhas/:id/criativos/gerar
        → Backend monta prompt com dados da campanha
        → Ideogram API → download imagem
        → Upload Supabase Storage
        → Salva Criativo (tipo: gerado_ia)
```

### Dashboard (síncrono — tempo real)
```
Usuário → Dashboard → Meta/Google Ads API (direto, usa account_id salvo)
```

---

## Estratégia de Testes

### Backend (Jest + ts-jest)
- **Routes**: mocks do service com `jest.mock('../service')` + supertest — padrão em `src/modules/**/__tests__/*.routes.test.ts`
- **Services**: mocks do Prisma com `jest.mock('../../lib/prisma')` — padrão em `src/modules/**/__tests__/*.service.test.ts`
- **Queue/Scheduler**: mock de `bullmq` e do Prisma — padrão em `src/queue/__tests__/*.test.ts`
- **Token de teste**: `jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret')`
- **Erros tipados**: services lançam `Error` com `err.name = 'NOT_FOUND' | 'FORBIDDEN' | ...` — testar com `rejects.toMatchObject({ name: '...' })`

### Frontend (Vitest + @testing-library/react)
- **Hooks**: `vi.mock('@/lib/api')` + `renderHook` + `waitFor`
- **Componentes UI**: `render` + `screen` + `userEvent` — sem checar estilos inline com `toHaveStyle` (não funciona bem com jsdom); usar `el.getAttribute('style').toContain(...)` quando precisar
- **Páginas com router**: envolver em `<MemoryRouter>` + `<AuthProvider>`; mockar `useNavigate` com `vi.mock('react-router-dom', ...)`
- **Páginas com AppLayout/Sidebar**: mockar `useAuth` com `vi.mock('@/contexts/AuthContext', ...)`
- **AuthContext**: testar erro "fora do provider" suprimindo `console.error` com `vi.spyOn(console, 'error').mockImplementation(() => {})`
- **Path alias `@/`**: configurado no `vitest.config.ts` via `resolve.alias: { '@': resolve(__dirname, 'src') }`

### Falhas pré-existentes conhecidas
- `integracoes.routes.test.ts` — 6 testes de callback OAuth falham porque o teste envia `Authorization` header, mas callbacks OAuth recebem JWT via `state` param (sem header). Esses testes precisam ser reescritos para usar `?state=<jwt>` na URL.

---

## O que NÃO fazer

- ❌ Não usar Next.js no backend
- ❌ Não salvar imagens no banco de dados
- ❌ Não salvar métricas no banco (buscar em tempo real)
- ❌ Não salvar logs de otimização da IA no banco
- ❌ Não extrair microserviços prematuramente
- ❌ Não usar `pg` diretamente — usar Prisma
- ❌ Não processar jobs de IA de forma síncrona no request do usuário
- ❌ Não criar funções sem testes — toda função nova deve ter teste correspondente (backend: service + route; frontend: hook + componente)
- ❌ Não usar `toHaveStyle` do jest-dom para checar estilos inline React no jsdom — usar `element.getAttribute('style').toContain(...)`
- ❌ Não usar `expect(() => render(...)).toThrow()` para erros de render do React sem suprimir `console.error` primeiro
- ❌ Não usar `prisma migrate dev` (requer terminal interativo) — usar `prisma db push`
- ❌ Não deixar o prompt do Ideogram no frontend — o backend monta o prompt completo
- ❌ Não usar authMiddleware nos callbacks OAuth — eles recebem redirect do browser sem header JWT
- ❌ Não usar versões < v20 da Google Ads API (v16–v19 foram descontinuadas)
- ❌ Não buscar métricas sem verificar se account_id está salvo na Integracao
