# AnalytiXPay 💳

PORTAL DEV SUPABASE

Sistema moderno de gestão de faturas de cartão de crédito com extração automática de transações via PDF parsing.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

- 🔐 **Autenticação completa** - Email/senha + Google OAuth
- 📄 **Upload de PDFs** - Drag & drop com processamento automático
- 🤖 **Extração automática** - Parser inteligente de transações
- 📊 **Dashboard** - Estatísticas e visualização de gastos
- 👥 **Contas compartilhadas** - Gestão familiar/grupo
- 🎨 **UI Moderna** - Dark mode, responsivo, animações
- 🔒 **Seguro** - Row Level Security (RLS) no Supabase
- ⚡ **Performático** - React Server Components + Edge Runtime

## 🚀 Quick Start

### 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/analytixpay.git
cd analytixpay
npm install
```

### 2. Configurar Supabase

```bash
# Setup automático (recomendado)
node scripts/setup-supabase.js

# Ou configure manualmente o .env.local (veja abaixo)
```

### 3. Executar Schema SQL

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor**
3. Execute o conteúdo de [src/db/schema.sql](src/db/schema.sql)

### 4. Criar Storage Bucket

1. Vá em **Storage**
2. Crie um bucket chamado `invoices` (privado)
3. Configure as políticas (veja [src/db/schema.sql](src/db/schema.sql) ou [docs/setup/CREATE_STORAGE_BUCKET.md](docs/setup/CREATE_STORAGE_BUCKET.md))

### 5. Rodar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

📖 **Guia completo**: [docs/guides/QUICKSTART.md](docs/guides/QUICKSTART.md)

## 📋 Variáveis de Ambiente

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Onde encontrar:**
- Supabase → Settings → API

## 🏗️ Stack Tecnológica

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript 5
- **Estilização**: Tailwind CSS 4
- **Componentes**: Shadcn UI + Radix UI
- **Ícones**: Lucide React
- **Animações**: Framer Motion
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **PDF Parse**: pdf-parse
- **API**: Next.js Server Actions

## 📁 Estrutura do Projeto

```
analytixpay/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── signup/
│   │   └── (dashboard)/       # Rotas protegidas
│   │       ├── dashboard/     # Dashboard principal
│   │       ├── invoices/      # Gerenciamento de faturas
│   │       ├── transactions/  # Visualização de transações
│   │       └── settings/      # Configurações
│   ├── components/
│   │   ├── ui/               # Componentes Shadcn
│   │   ├── auth/             # Componentes de autenticação
│   │   ├── dashboard/        # Componentes do dashboard
│   │   ├── invoices/         # Componentes de faturas
│   │   ├── transactions/     # Componentes de transações
│   │   ├── settings/         # Componentes de configurações
│   │   └── shared/           # Componentes compartilhados
│   ├── actions/              # Server Actions
│   │   ├── auth.actions.ts
│   │   ├── account.actions.ts
│   │   ├── invoice.actions.ts
│   │   └── transaction.actions.ts
│   ├── lib/
│   │   ├── supabase/         # Cliente Supabase
│   │   ├── pdf/              # Parser de PDF
│   │   ├── validations/      # Schemas Zod
│   │   └── utils.ts          # Utilitários
│   └── hooks/                # Custom React Hooks
├── db/
│   ├── schema.sql            # Schema PostgreSQL
│   └── types.ts              # TypeScript types
├── scripts/
│   └── setup-supabase.js     # Script de setup
└── docs/                     # Documentação
```

## 🎯 Funcionalidades Principais

### 1. Autenticação
- Login com email e senha
- Cadastro com validação
- Google OAuth
- Proteção de rotas via middleware
- Logout com limpeza de sessão

### 2. Upload de Faturas
- Drag & drop de arquivos PDF
- Validação de tipo e tamanho
- Upload para Supabase Storage
- Processamento automático
- Feedback visual de progresso

### 3. Extração de Transações
- Parser automático de PDF
- Detecção de padrões (data, estabelecimento, valor)
- Categorização automática com keywords
- Identificação de parcelamento
- Suporte a transações internacionais

### 4. Dashboard
- Cards de estatísticas (gasto total, média, etc)
- Breakdown por categoria
- Comparação mensal
- Últimas transações
- Visualização responsiva

### 5. Gestão de Contas
- Criar contas compartilhadas
- Sistema de roles (owner/member)
- Adicionar/remover membros
- Múltiplas contas por usuário

## 🎨 Design

- **Tema**: Dark mode por padrão
- **Paleta**: Azul (#3b82f6) + Cinza escuro
- **Typography**: Geist Font (Vercel)
- **Responsivo**: Mobile-first design
- **Animações**: Transições suaves com Framer Motion

## 📊 Banco de Dados

### Tabelas Principais

- `accounts` - Contas compartilhadas
- `account_members` - Membros das contas
- `invoices` - Faturas enviadas
- `transactions` - Transações extraídas
- `categories` - Categorias de gastos
- `profiles` - Perfis de usuários

### Segurança (RLS)

Todas as tabelas têm Row Level Security habilitado:
- Usuários só acessam dados das suas contas
- Owners podem adicionar/remover membros
- Validação em Server Actions

## 🧪 Testes (Futuro)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Deploy

### Vercel (Recomendado)

```bash
# Deploy automático ao fazer push na main
git push origin main
```

### Docker

```bash
docker build -t analytixpay .
docker run -p 3000:3000 analytixpay
```

📖 **Guia completo**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (Turbopack)
npm run build        # Build de produção
npm run start        # Rodar produção
npm run lint         # Linter (Biome)
npm run format       # Formatar código (Biome)
npm run test         # Testes (Vitest)
npm run test:coverage # Testes com coverage
```

## 📚 Documentação

**Toda a documentação foi reorganizada na pasta [docs/](docs/)**

### 📖 Início Rápido
- [QUICKSTART.md](docs/guides/QUICKSTART.md) - Início rápido em 5 minutos
- [PROJECT_DOCUMENTATION.md](docs/guides/PROJECT_DOCUMENTATION.md) - Arquitetura completa

### ⚙️ Setup e Configuração
- [INSTALLATION.md](docs/setup/INSTALLATION.md) - Instalação detalhada
- [SETUP_GUIDE.md](docs/setup/SETUP_GUIDE.md) - Guia detalhado de setup
- [GOOGLE_OAUTH_SETUP.md](docs/setup/GOOGLE_OAUTH_SETUP.md) - Setup OAuth
- [ANTHROPIC_SETUP.md](docs/setup/ANTHROPIC_SETUP.md) - Setup Anthropic Claude (AI parsing)

### 🚀 Deploy e Melhorias
- [DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) - Guia de deploy
- [IMPROVEMENT_PLAN.md](docs/improvements/IMPROVEMENT_PLAN.md) - Plano de melhorias completo
- [IMPROVEMENTS_IMPLEMENTED.md](docs/improvements/IMPROVEMENTS_IMPLEMENTED.md) - Melhorias já implementadas

### 📋 Ver Tudo
- **[docs/README.md](docs/README.md)** - Índice completo da documentação

## 🛣️ Roadmap

- [ ] Filtros avançados em transações
- [ ] Edição manual de transações
- [ ] Gráficos com Recharts
- [ ] Export para CSV/Excel
- [ ] Notificações por email
- [x] Parsing de PDF com IA (Claude)
- [ ] App mobile (React Native)
- [ ] Integração com Open Banking
- [ ] Alertas de gastos
- [ ] Relatórios personalizados

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](./LICENSE) para mais informações.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu-email@exemplo.com

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Desenvolvido com ❤️ usando Next.js e Supabase**

**Status**: ✅ Produção Ready
**Versão**: 1.0.0
**Última atualização**: 2025-10-12
