# 📚 Documentação do AnalytiXPay

Bem-vindo à documentação completa do AnalytiXPay - Sistema de Gestão de Faturas de Cartão de Crédito.

---

## 📖 Índice

- [Guias de Início Rápido](#-guias-de-início-rápido)
- [Configuração e Setup](#-configuração-e-setup)
- [Guias Técnicos](#-guias-técnicos)
- [Melhorias e Otimizações](#-melhorias-e-otimizações)
- [Planejamento e Arquitetura](#-planejamento-e-arquitetura)
- [Documentos Arquivados](#-documentos-arquivados)

---

## 🚀 Guias de Início Rápido

### Para Usuários Novos

1. **[QUICKSTART.md](guides/QUICKSTART.md)** ⭐
   - Início em 5 minutos
   - Setup básico do projeto
   - Primeiros passos

### Para Desenvolvedores

2. **[PROJECT_DOCUMENTATION.md](guides/PROJECT_DOCUMENTATION.md)** ⭐
   - Arquitetura completa do projeto
   - Estrutura de pastas
   - Padrões de código
   - Fluxos de dados

---

## ⚙️ Configuração e Setup

### Instalação Inicial

- **[INSTALLATION.md](setup/INSTALLATION.md)**
  - Instalação completa passo a passo
  - Requisitos de sistema
  - Dependências

- **[SETUP_GUIDE.md](setup/SETUP_GUIDE.md)**
  - Guia detalhado de configuração
  - Configuração do ambiente
  - Variáveis de ambiente

### Configurações Específicas

- **[GOOGLE_OAUTH_SETUP.md](setup/GOOGLE_OAUTH_SETUP.md)**
  - Configuração do Google OAuth
  - Credenciais e callbacks
  - Integração com Supabase Auth

- **[ANTHROPIC_SETUP.md](setup/ANTHROPIC_SETUP.md)**
  - Configuracao da API Anthropic Claude
  - AI-powered PDF parsing com suporte nativo a PDF
  - Custos e limites

- **[CREATE_STORAGE_BUCKET.md](setup/CREATE_STORAGE_BUCKET.md)**
  - Criação do bucket no Supabase Storage
  - Políticas de acesso (RLS)
  - Upload de arquivos

### Pendências

- **[PENDING_SETUP.md](setup/PENDING_SETUP.md)** ⚠️
  - Configurações que ainda precisam ser feitas
  - Checklist de setup
  - Ações necessárias

---

## 🛠️ Guias Técnicos

### Deployment

- **[DEPLOYMENT.md](guides/DEPLOYMENT.md)**
  - Deploy para produção
  - Vercel, Railway, ou Docker
  - Variáveis de ambiente em produção

- **[DEPLOYMENT_CHECKLIST.md](guides/DEPLOYMENT_CHECKLIST.md)**
  - Checklist completo antes do deploy
  - Verificações de segurança
  - Otimizações

### Debugging

- **[DEBUG_PDF_PARSER.md](guides/DEBUG_PDF_PARSER.md)**
  - Debugging do parser de PDF
  - Problemas comuns
  - Logs e troubleshooting

---

## 🚀 Melhorias e Otimizações

### Plano de Melhorias (2025-10-24)

- **[IMPROVEMENT_PLAN.md](improvements/IMPROVEMENT_PLAN.md)** ⭐
  - Plano completo de melhorias
  - 15 otimizações propostas
  - Organizado por prioridade (P0-P4)
  - Estimativas de tempo e impacto
  - Exemplos de código

### Implementações Realizadas

- **[IMPROVEMENTS_IMPLEMENTED.md](improvements/IMPROVEMENTS_IMPLEMENTED.md)** ⭐
  - Resumo das melhorias implementadas
  - O que foi feito (P0, P1, P3)
  - Impacto das mudanças
  - Como usar as novas features

**Melhorias Implementadas:**
- ✅ P0 - Validação de env vars, rate limiting, logging
- ✅ P1 - Helpers de acesso, stats centralizados, cache PDF, paginação
- ✅ P3 - Input sanitization
- ✅ Testes configurados (Vitest)

---

## 📋 Planejamento e Arquitetura

### Planos de Implementação

- **[IMPLEMENTATION_PLAN.md](planning/IMPLEMENTATION_PLAN.md)**
  - Plano de implementação inicial
  - Roadmap do MVP

- **[IMPLEMENTATION_SUMMARY.md](planning/IMPLEMENTATION_SUMMARY.md)**
  - Resumo das implementações concluídas

- **[MVP_LAUNCH_PLAN.md](planning/MVP_LAUNCH_PLAN.md)**
  - Plano de lançamento do MVP
  - Features essenciais
  - Timeline

### Planejamentos Específicos

- **[PLANEJAMENTO_IMPLEMENTACAO.md](planning/PLANEJAMENTO_IMPLEMENTACAO.md)** (PT-BR)
  - Planejamento técnico detalhado

- **[PLANEJAMENTO_AI_PARSER.md](planning/PLANEJAMENTO_AI_PARSER.md)**
  - Planejamento do parser com AI
  - Integracao Anthropic Claude (migrado de OpenAI)
  - Hybrid approach (AI + regex)

- **[EDIT_TRANSACTION_PLAN.md](planning/EDIT_TRANSACTION_PLAN.md)**
  - Plano de implementação de edição de transações
  - UI/UX considerations

---

## 🗂️ Documentos Arquivados

Documentos históricos e já concluídos:

- **[TODO_LIST.md](archived/TODO_LIST.md)**
  - Lista de tarefas original (concluída)

- **[COMMIT_SUMMARY.md](archived/COMMIT_SUMMARY.md)**
  - Resumo de commits antigos

- **[FINAL_SUMMARY.md](archived/FINAL_SUMMARY.md)**
  - Resumo final de uma fase do projeto

- **[ALTERNATIVE_FIX.md](archived/ALTERNATIVE_FIX.md)**
  - Fix alternativo para problema específico (resolvido)

- **[HOTFIX_RLS.md](archived/HOTFIX_RLS.md)**
  - Hotfix para Row Level Security (aplicado)

- **[DEPENDENCIES_TO_INSTALL.md](archived/DEPENDENCIES_TO_INSTALL.md)**
  - Dependências antigas (já instaladas)

---

## 🎯 Documentos Principais (Raiz do Projeto)

Mantidos na raiz por importância:

### README.md ⭐
- Visão geral do projeto
- Features principais
- Quick start
- Stack tecnológica

### CLAUDE.md ⭐⭐⭐
- **Instruções para Claude Code**
- Padrões do projeto
- Arquitetura
- Server Actions
- PDF Parsing
- **SEMPRE consultar este arquivo ao trabalhar no projeto**

---

## 🗄️ Database (SQL)

Todos os arquivos SQL estão organizados em `src/db/`:

### Schema Principal
- **[src/db/schema.sql](../src/db/schema.sql)** ⭐
  - Schema completo do banco
  - Todas as tabelas, RLS policies, triggers
  - Execute no Supabase SQL Editor no setup inicial

### Types
- **[src/db/types.ts](../src/db/types.ts)**
  - TypeScript types do banco
  - Type-safe database access

### Migrations
- **[src/db/migrations/](../src/db/migrations/)**
  - Migrations e hotfixes aplicados
  - Organizado por número sequencial

### Documentação Completa
- **[src/db/README.md](../src/db/README.md)** ⭐
  - Guia completo do banco de dados
  - Como criar migrations
  - RLS policies explicadas
  - Schema overview

---

## 📊 Organização da Documentação

```
docs/
├── README.md                    # Este arquivo (índice geral)
├── setup/                       # Configuração e instalação
│   ├── INSTALLATION.md
│   ├── SETUP_GUIDE.md
│   ├── GOOGLE_OAUTH_SETUP.md
│   ├── ANTHROPIC_SETUP.md
│   ├── CREATE_STORAGE_BUCKET.md
│   └── PENDING_SETUP.md
├── guides/                      # Guias técnicos
│   ├── QUICKSTART.md
│   ├── PROJECT_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── DEBUG_PDF_PARSER.md
├── improvements/                # Melhorias e otimizações
│   ├── IMPROVEMENT_PLAN.md
│   └── IMPROVEMENTS_IMPLEMENTED.md
├── planning/                    # Planejamento e arquitetura
│   ├── IMPLEMENTATION_PLAN.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── MVP_LAUNCH_PLAN.md
│   ├── PLANEJAMENTO_IMPLEMENTACAO.md
│   ├── PLANEJAMENTO_AI_PARSER.md
│   └── EDIT_TRANSACTION_PLAN.md
└── archived/                    # Documentos históricos
    ├── TODO_LIST.md
    ├── COMMIT_SUMMARY.md
    ├── FINAL_SUMMARY.md
    ├── ALTERNATIVE_FIX.md
    ├── HOTFIX_RLS.md
    └── DEPENDENCIES_TO_INSTALL.md
```

---

## 🔍 Como Encontrar o que Você Precisa

### Preciso configurar o projeto pela primeira vez?
→ Comece com [QUICKSTART.md](guides/QUICKSTART.md)

### Preciso entender a arquitetura?
→ Leia [PROJECT_DOCUMENTATION.md](guides/PROJECT_DOCUMENTATION.md)

### Preciso configurar OAuth ou Anthropic Claude?
→ Veja [setup/](setup/)

### Preciso fazer deploy?
→ Siga [DEPLOYMENT.md](guides/DEPLOYMENT.md) e [DEPLOYMENT_CHECKLIST.md](guides/DEPLOYMENT_CHECKLIST.md)

### Quero ver as últimas melhorias?
→ Consulte [improvements/](improvements/)

### Preciso debugar o PDF parser?
→ Use [DEBUG_PDF_PARSER.md](guides/DEBUG_PDF_PARSER.md)

### Estou usando Claude Code?
→ **SEMPRE leia [CLAUDE.md](../CLAUDE.md) na raiz do projeto**

---

## 📝 Convenções

- **⭐** = Documento essencial
- **⭐⭐⭐** = Documento crítico (leitura obrigatória)
- **⚠️** = Ação necessária
- **✅** = Concluído/Implementado
- **📋** = Planejamento
- **🗂️** = Histórico/Arquivado

---

## 🤝 Contribuindo com a Documentação

Ao adicionar novos documentos:

1. Coloque no diretório apropriado
2. Atualize este README.md
3. Use nomes descritivos em UPPER_SNAKE_CASE.md
4. Adicione data no cabeçalho do documento
5. Mantenha CLAUDE.md atualizado com mudanças importantes

---

**Última atualização:** 2025-10-24
**Versão:** 2.0 (Reorganização completa)
