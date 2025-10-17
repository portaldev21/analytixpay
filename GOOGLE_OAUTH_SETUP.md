# 🔐 Configuração do Google OAuth - AnalytiXPay

## ⚠️ Status Atual

**O Google OAuth NÃO está configurado no Supabase.**

Por isso o botão "Continuar com Google" fica carregando e mostra erro.

---

## ✅ Como Configurar (10 minutos)

### **Passo 1: Acessar Console do Google Cloud**

1. Vá em: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Crie um novo projeto (ou selecione um existente)
   - Nome sugerido: `AnalytiXPay`

---

### **Passo 2: Configurar Tela de Consentimento**

1. No menu lateral, vá em **APIs & Services** → **OAuth consent screen**
2. Selecione **External** (para qualquer usuário Google fazer login)
3. Clique em **Create**
4. Preencha:
   - **App name**: `AnalytiXPay`
   - **User support email**: seu email
   - **Developer contact**: seu email
5. Clique em **Save and Continue**
6. Em **Scopes**, clique em **Add or Remove Scopes**
   - Selecione: `email`, `profile`, `openid`
   - Clique em **Update**
7. Clique em **Save and Continue** até finalizar

---

### **Passo 3: Criar Credenciais OAuth**

1. No menu lateral, vá em **APIs & Services** → **Credentials**
2. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Selecione **Application type**: `Web application`
4. Preencha:
   - **Name**: `AnalytiXPay Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desenvolvimento)
     - Sua URL de produção futuramente (ex: `https://analytixpay.vercel.app`)
   - **Authorized redirect URIs**:
     - `https://qzczyicspbizosjogmlq.supabase.co/auth/v1/callback`
5. Clique em **Create**
6. **ANOTE** as credenciais:
   - `Client ID`
   - `Client Secret`

---

### **Passo 4: Configurar no Supabase**

1. Acesse: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq
2. Vá em **Authentication** → **Providers**
3. Encontre **Google** na lista
4. Clique para expandir
5. Ative o toggle **Enable Sign in with Google**
6. Cole as credenciais:
   - **Client ID**: (do Passo 3)
   - **Client Secret**: (do Passo 3)
7. Clique em **Save**

---

### **Passo 5: Testar**

1. Reinicie o servidor (`npm run dev`)
2. Vá em http://localhost:3000/login
3. Clique em **Continuar com Google**
4. Deve abrir a tela de login do Google
5. Após autenticação, deve voltar para `/dashboard`

---

## 🎯 **Por Enquanto (Sem Google OAuth)**

### Opção 1: Usar Login com Email/Senha

O sistema funciona **100% sem Google OAuth**. Use o formulário de cadastro:

1. Vá em http://localhost:3000/signup
2. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 8 caracteres)
3. Clique em **Criar conta**
4. Pronto! Você será redirecionado para o dashboard

### Opção 2: Desativar Botão do Google (Temporário)

Se preferir esconder o botão temporariamente:

1. Edite [src/components/auth/LoginForm.tsx](src/components/auth/LoginForm.tsx)
2. Comente a linha do `<GoogleButton />`

```tsx
{/* <GoogleButton /> */}
```

---

## 📚 **Documentação Oficial**

- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js OAuth](https://nextjs.org/docs/authentication)

---

## ✅ **Checklist de Configuração**

- [ ] Criar projeto no Google Cloud Console
- [ ] Configurar tela de consentimento
- [ ] Criar OAuth Client ID
- [ ] Copiar Client ID e Client Secret
- [ ] Configurar no Supabase (Authentication → Providers → Google)
- [ ] Adicionar redirect URI no Google Console
- [ ] Testar login com Google

---

## 🚨 **Importante**

### Segurança:
- **NUNCA** exponha o `Client Secret` no frontend
- O Supabase gerencia isso de forma segura no backend

### Ambiente de Produção:
Quando fizer deploy, adicione as URLs de produção:

**Google Console:**
- Authorized JavaScript origins: `https://seu-dominio.com`
- Redirect URIs: `https://qzczyicspbizosjogmlq.supabase.co/auth/v1/callback`

**Supabase:**
- Já está configurado, não precisa alterar nada

---

**Tempo estimado**: 10 minutos
**Dificuldade**: Fácil
**Custo**: Grátis

🤖 Generated with [Claude Code](https://claude.com/claude-code)
