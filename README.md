# CRM SaaS Multi-tenant

Um CRM completo construído com NestJS, Angular e PostgreSQL, organizado em monorepo Nx.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS + Fastify |
| Frontend | Angular 19 + CDK |
| Banco de dados | PostgreSQL 16 |
| ORM | Prisma |
| Cache/Filas | Redis 7 |
| Autenticação | JWT (access + refresh tokens) |
| Documentação API | Swagger/OpenAPI |
| Monorepo | Nx |

## Pré-requisitos

- Node.js >= 20
- Docker + Docker Compose
- Git

## Setup Rápido

```bash
# 1. Clone e instale dependências
git clone <repo-url>
cd CRM
npm install --legacy-peer-deps

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com seus valores

# 3. Suba o banco de dados e Redis
docker-compose up postgres redis -d

# 4. Execute as migrations
npx prisma migrate dev

# 5. (Opcional) Popule com dados de exemplo
npx ts-node prisma/seed.ts

# 6. Inicie o servidor de desenvolvimento
npm run api:dev    # API em http://localhost:3000/api/v1
npm run web:dev    # Web em http://localhost:4200
```

## Desenvolvimento com Docker (full-stack)

```bash
docker-compose up --build
```

- Frontend: http://localhost:4200
- API: http://localhost:3000/api/v1
- Docs Swagger: http://localhost:3000/api/v1/docs

## Credenciais Padrão (seed)

| Usuário | Email | Senha | Role |
|---------|-------|-------|------|
| Admin Demo | admin@demo.com | Admin@123456 | ADMIN |
| João Vendedor | vendedor@demo.com | Seller@123456 | SELLER |

## Estrutura do Projeto

```
CRM/
├── apps/
│   ├── api/                    # NestJS + Fastify API
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/       # JWT auth + refresh tokens
│   │       │   ├── contacts/   # Contatos, empresas, tags, timeline
│   │       │   ├── deals/      # Pipeline Kanban
│   │       │   ├── tasks/      # Tarefas + calendário
│   │       │   └── users/      # Usuários + RBAC
│   │       ├── common/         # Guards, decorators, filters, interceptors
│   │       └── prisma/         # PrismaService global
│   └── web/                    # Angular 19 SPA
│       └── src/app/
│           ├── core/           # Services, guards, interceptors, modelos
│           └── features/
│               ├── auth/       # Login + registro
│               ├── shell/      # Layout + sidebar
│               ├── dashboard/  # Visão geral
│               ├── contacts/   # Lista + detalhes + timeline
│               ├── deals/      # Kanban drag-and-drop
│               └── tasks/      # Lista + calendário
├── prisma/
│   ├── schema.prisma           # Schema completo do banco
│   └── seed.ts                 # Dados de demonstração
├── docker-compose.yml
└── .env.example
```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Registro de novo tenant
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET  /api/v1/auth/me` - Perfil do usuário logado

### Contatos
- `GET  /api/v1/contacts` - Listar (com paginação, filtros, busca)
- `POST /api/v1/contacts` - Criar
- `GET  /api/v1/contacts/:id` - Detalhes + negócios + tarefas
- `GET  /api/v1/contacts/:id/timeline` - Timeline (cursor-based)
- `POST /api/v1/contacts/:id/activities` - Adicionar atividade
- `DELETE /api/v1/contacts/:id/gdpr` - Exclusão LGPD

### Negócios (Kanban)
- `GET  /api/v1/deals/pipelines` - Listar pipelines
- `GET  /api/v1/deals/kanban/:pipelineId` - Board Kanban
- `POST /api/v1/deals` - Criar negócio
- `PATCH /api/v1/deals/:id/move` - Mover no Kanban

### Tarefas
- `GET  /api/v1/tasks` - Listar com filtros
- `GET  /api/v1/tasks/calendar?start=&end=` - Visão calendário
- `PATCH /api/v1/tasks/:id/complete` - Concluir tarefa

### Usuários (Admin)
- `GET  /api/v1/users` - Listar usuários
- `POST /api/v1/users/invite` - Convidar usuário

## Controle de Acesso (RBAC)

| Recurso | SELLER | MANAGER | ADMIN |
|---------|--------|---------|-------|
| Próprios contatos/negócios | ✅ | ✅ | ✅ |
| Todos da equipe | ❌ | ✅ | ✅ |
| Gestão de usuários | ❌ | ❌ | ✅ |
| LGPD - exclusão de dados | ❌ | ❌ | ✅ |

## Multi-tenancy

Todos os dados são isolados por `tenant_id`. Cada organização que se registra via `/auth/register` obtém um tenant isolado. O `TenantMiddleware` extrai o `tenantId` do JWT e o injeta no contexto de cada requisição via `AsyncLocalStorage`.

## Roadmap

- [ ] Automação de workflows (BullMQ)
- [ ] Integração com e-mail (Gmail/Outlook via OAuth)
- [ ] Integração WhatsApp (Meta Business API)
- [ ] Relatórios e dashboards analytics
- [ ] Geração de propostas em PDF
- [ ] Assinatura eletrônica
- [ ] App mobile (Ionic/Capacitor)
