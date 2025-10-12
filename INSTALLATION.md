# Instruções de Instalação - AnalytiXPay

## 1. Instalar Dependências

Execute os seguintes comandos para instalar todas as dependências necessárias:

```bash
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers framer-motion lucide-react pdf-parse class-variance-authority clsx tailwind-merge
```

```bash
npm install -D @types/pdf-parse
```

## 2. Inicializar Shadcn UI

```bash
npx shadcn@latest init
```

Quando perguntado, use estas configurações:
- Would you like to use TypeScript? **Yes**
- Which style would you like to use? **New York**
- Which color would you like to use as base color? **Slate**
- Where is your global CSS file? **src/app/globals.css**
- Would you like to use CSS variables for colors? **Yes**
- Where is your tailwind.config.js located? **tailwind.config.ts**
- Configure the import alias for components: **@/components**
- Configure the import alias for utils: **@/lib/utils**

## 3. Instalar Componentes Shadcn UI

```bash
npx shadcn@latest add button card input label table dialog dropdown-menu select tabs avatar badge progress toast form popover calendar command separator skeleton switch textarea
```

## 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Configurar Supabase

### 5.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e as chaves para o `.env.local`

### 5.2. Executar SQL Schema

No Supabase Dashboard > SQL Editor, execute o arquivo `db/schema.sql` que será criado.

### 5.3. Configurar Storage

1. Vá em Storage no Supabase Dashboard
2. Crie um bucket chamado `invoices`
3. Configure as políticas de acesso:

```sql
-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Users can upload their own invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir leitura apenas para membros da conta
CREATE POLICY "Users can read invoices from their accounts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');
```

## 6. Estrutura de Pastas

Todas as pastas e arquivos serão criados automaticamente. A estrutura final será:

```
analytixpay/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── invoices/
│   │   │   ├── transactions/
│   │   │   └── settings/
│   │   └── api/
│   ├── components/
│   │   ├── ui/              # Shadcn components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── transactions/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── pdf/
│   │   ├── validations/
│   │   └── utils.ts
│   ├── actions/
│   ├── db/
│   └── hooks/
├── public/
└── ...
```

## 7. Desenvolvimento

Após todas as instalações, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 8. Checklist de Configuração

- [ ] Dependências instaladas
- [ ] Shadcn UI inicializado
- [ ] Componentes Shadcn instalados
- [ ] Arquivo `.env.local` criado e configurado
- [ ] Projeto Supabase criado
- [ ] Schema SQL executado
- [ ] Storage bucket criado
- [ ] Políticas de acesso configuradas
- [ ] Servidor rodando sem erros

## 9. Troubleshooting

### Erro de importação do pdf-parse

Se houver erro com pdf-parse no ambiente do navegador, adicione ao `next.config.ts`:

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
  }
  return config;
}
```

### Erro de CORS no Supabase

Verifique se a URL do seu app está nas URLs permitidas:
Supabase Dashboard > Settings > API > URL Configuration

---

**Próximo passo**: Após completar a instalação, todos os componentes e funcionalidades estarão disponíveis.
