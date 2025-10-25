# Quick Start - AnalytiXPay

Guia rápido para rodar o projeto em 5 minutos.

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

#### a) Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha os dados e aguarde ~2 minutos

#### b) Executar o Schema SQL

1. Vá em **SQL Editor** (menu lateral)
2. Clique em "New Query"
3. Copie todo o conteúdo de `db/schema.sql`
4. Cole e clique em "Run"

#### c) Criar Storage Bucket

1. Vá em **Storage** (menu lateral)
2. Clique em "Create a new bucket"
3. Nome: `invoices`
4. Public: **OFF** (deixe privado)
5. Clique em "Create"

#### d) Configurar Políticas de Storage

No bucket `invoices`, clique em **Policies** e adicione as 3 políticas (copie do `db/schema.sql`, linhas 306-335)

### 3. Configurar Variáveis de Ambiente

#### Opção 1: Script Automático (Recomendado)

```bash
node scripts/setup-supabase.js
```

Siga as instruções e cole as chaves do Supabase.

#### Opção 2: Manual

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Onde encontrar as chaves:**
1. Vá em **Settings** → **API**
2. Copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Executar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📱 Testando a Aplicação

### Primeiro Acesso

1. **Criar Conta**
   - Vá em http://localhost:3000/signup
   - Cadastre-se com email e senha
   - Ou use Google OAuth (se configurado)

2. **Criar uma Conta Compartilhada**
   - Vá em `/settings`
   - Clique em "Criar Nova Conta"
   - Digite um nome (ex: "Minha Família")

3. **Upload de Fatura**
   - Vá em `/invoices`
   - Arraste um PDF de fatura de cartão
   - Aguarde o processamento automático

4. **Ver Transações**
   - Vá em `/transactions`
   - Visualize as transações extraídas

5. **Ver Dashboard**
   - Vá em `/dashboard`
   - Veja estatísticas e gráficos

## 🎯 Estrutura do Projeto

```
analytixpay/
├── src/
│   ├── app/              # Rotas Next.js
│   │   ├── (auth)/       # Login/Signup
│   │   └── (dashboard)/  # Dashboard, Invoices, etc
│   ├── components/       # Componentes React
│   ├── actions/          # Server Actions
│   ├── lib/              # Utilitários
│   └── hooks/            # Custom Hooks
├── db/
│   ├── schema.sql        # Schema do banco
│   └── types.ts          # Types TypeScript
└── scripts/
    └── setup-supabase.js # Script de setup
```

## ⚙️ Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar produção local
npm run start

# Linter/Formatter (Biome)
npm run lint
npm run format
```

## 🔧 Configuração Adicional

### Google OAuth (Opcional)

1. Vá em **Authentication** → **Providers** no Supabase
2. Ative "Google"
3. Crie credenciais OAuth no [Google Cloud Console](https://console.cloud.google.com)
4. Cole Client ID e Client Secret no Supabase

### Customizar Tema

Edite `src/app/globals.css` para alterar cores:

```css
:root {
  --primary: 217.2 91.2% 59.8%; /* Azul principal */
  --secondary: 217.2 32.6% 17.5%; /* Cinza escuro */
  /* ... */
}
```

## ❓ Problemas Comuns

### "Invalid API Key"

- Verifique se `.env.local` está na raiz do projeto
- Confirme que as chaves estão corretas
- Reinicie o servidor (`npm run dev`)

### Erro ao fazer upload

- Verifique se o bucket `invoices` foi criado
- Confirme que as políticas de storage estão configuradas

### Página em branco

- Abra o console do navegador (F12)
- Verifique se há erros
- Confirme que o Supabase está configurado

## 📚 Documentação Completa

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Arquitetura completa
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Guia detalhado de setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deploy
- [INSTALLATION.md](./INSTALLATION.md) - Instalação detalhada

## 🎉 Pronto!

Agora você tem um sistema completo de gestão de faturas de cartão de crédito rodando localmente!

**Stack:**
- ⚡ Next.js 15
- 🎨 Tailwind CSS + Shadcn UI
- 🔐 Supabase (Auth + Database + Storage)
- 📄 PDF Parsing automático
- 🌙 Dark mode

---

**Desenvolvido com Next.js e Supabase**
