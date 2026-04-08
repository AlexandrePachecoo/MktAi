# CLAUDE.md — AI Ads Platform

Arquivo de contexto arquitetural para o Claude Code. Leia antes de qualquer decisão técnica.

---

## O que é esse projeto

Plataforma com IA para gerenciar campanhas no Meta Ads e Google Ads. Gera estratégias, criativos e testes A/B — e otimiza orçamentos automaticamente a cada hora via fila de jobs.

---

## Requisitos Funcionais

- Usuário conecta suas contas do Meta Ads e Google Ads via OAuth
- Usuário preenche nome, descrição e público-alvo da campanha
- IA gera uma estratégia de campanha com testes A/B
- IA gerencia as campanhas e otimiza resultados com base no orçamento
- IA gera criativos (imagens) para as campanhas

---

## Stack Definida

| Camada | Tecnologia |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Testes | Jest |
| Banco de dados | PostgreSQL (Neon) |
| Migrations | node-pg-migrate |
| ORM | Prisma |
| IA | OpenAI (ChatGPT + DALL-E) |
| Fila de jobs | BullMQ + Redis |
| Object Storage | Cloudflare R2 ou Supabase Storage |

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
As métricas de campanhas são buscadas em tempo real diretamente nas APIs do Meta/Google. Não há entidade de métricas no banco de dados. Revisitar essa decisão quando a IA precisar comparar performance entre períodos.

---

## Modelo de Dados

### User
```
id, nome, email, hash_pass, plano, created_at
```

### Campanhas
```
id, user_id, nome, descricao, publico_alvo, orcamento, plataforma, status, created_at
```
- `plataforma`: meta | google | ambos
- `status`: ativa | pausada | encerrada

### Criativos
```
id, campanha_id, url_imagem, tipo, created_at
```
- `tipo`: gerado_ia | upload
- `url_imagem`: URL no Object Storage (não salvar imagem no banco)

### Testes A/B
```
id, campanha_id, criativo_id_a, criativo_id_b, resultado, status
```
- `variante_a` e `variante_b` referenciam IDs de Criativos

### Integrações
```
id, user_id, plataforma, access_token, refresh_token, expires_at
```

---

## Endpoints da API

### Auth
```
POST /auth/register
POST /auth/login
```

### Integrações
```
POST /auth/integracoes   → OAuth Meta/Google
```

### Campanhas
```
GET    /campanhas
POST   /campanhas        → { nome, descricao, publico_alvo, orcamento, plataforma }
GET    /campanhas/:id
PUT    /campanhas/:id
DELETE /campanhas/:id
POST   /campanhas/:id/publicar
```

### Dashboard
```
GET /dashboard/:campanha_id  → busca dados em tempo real na Meta/Google
```

### Criativos
```
POST /upload                          → faz upload da imagem, retorna URL
POST /campanhas/:id/criativos         → associa criativo à campanha
```

### Testes A/B
```
GET  /campanhas/:id/testes-ab
POST /campanhas/:id/testes-ab
```

---

## Arquitetura — Fluxo dos Dados

### Fluxo do usuário (síncrono)
```
Usuário → API Gateway (JWT + rate limit) → Módulo → PostgreSQL
                                                   → Object Storage (só criativos)
```

### Fluxo da IA (assíncrono — a cada 1h)
```
Cron (1h) → Fila de Jobs (BullMQ) → AI Engine
                                   → PostgreSQL (lê campanhas e tokens)
                                   → Meta/Google Ads (otimiza)
                                   → DALL-E (só se gerar criativo)
                                   → Object Storage (salva imagem gerada)
                                   → PostgreSQL (atualiza status)
```

### Dashboard (síncrono — tempo real)
```
Usuário → Dashboard → Meta/Google Ads (direto, sem passar pela fila)
```

---

## Estimativas de Capacidade

| Métrica | Lançamento (100 users) | 1 ano (500 users) |
|---|---|---|
| Jobs/dia | 12.000 | 60.000 |
| Chamadas às APIs externas/dia | 36.000 | 180.000 |
| Storage imagens/mês | ~2GB | ~10GB |
| Storage banco/mês | ~450MB | ~2GB |

- Média de 5 campanhas por usuário
- Verificação a cada 1h (24x/dia)
- ~3 chamadas às APIs externas por job

---

## O que NÃO fazer

- ❌ Não usar Next.js no backend
- ❌ Não salvar imagens no banco de dados
- ❌ Não salvar métricas no banco (buscar em tempo real por enquanto)
- ❌ Não extrair microserviços prematuramente
- ❌ Não usar `pg` diretamente como ORM — usar Prisma
- ❌ Não processar jobs de IA de forma síncrona no request do usuário
