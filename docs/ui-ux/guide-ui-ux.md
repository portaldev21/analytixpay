# Guia de UI/UX – App de Finanças (Estilo “PrimeTrust”) – **Mobile & Desktop**

> Este documento serve como **referência visual e de UX** para qualquer IA ou dev que for criar telas do app de finanças.  
> **Mobile first**, mas sempre com comportamentos claros para **desktop**.

---

## 1. Visão geral do estilo

- **Tema:** dark, premium, moderno (fintech/crypto).
- **Estilo visual:**  
  - **Glassmorphism** (cards translúcidos, blur, borda fina clara).  
  - **Neumorphism leve** (blocos escuros com sombras suaves).  
  - **Gradientes neon** (azul, roxo, verde água) para dar “tech/futurista”.
- **Sensação:** tecnologia + segurança + sofisticação.
- **Formas:** tudo bem arredondado (cards, botões, navbar, chips).
- **Abordagem de layout:**  
  - **Mobile first** → projetar tudo pensando em 1 coluna.  
  - Em **desktop**, transformar em **grid de cards** com 2–4 colunas, mantendo a mesma linguagem visual.

---

## 2. Design Tokens

### 2.1. Cores

**Plano de fundo**

- `color.surface-page`: `#F7F6F9` (fundo fora do app, mockups, etc.)
- `color.bg-main-gradient-top`: `#1E2363`
- `color.bg-main-gradient-bottom`: `#070D3D`

**Cards & elementos escuros**

- `color.card-dark-1`: `#09183A`
- `color.card-dark-2`: `#171C4F`
- `color.card-dark-3`: `#111B3E`

**Cores de destaque**

- `color.primary-gradient-start`: `#42A7A4`  (verde água claro)
- `color.primary-gradient-end`: `#00353B`    (verde escuro)
- `color.purple-light`: `#AA88F5`
- `color.purple-mid`: `#5F57B7`
- `color.purple-dark`: `#1D1D3D`
- `color.card-blue-start`: `#6E88BA`
- `color.card-blue-end`: `#214E98`

**Feedback**

- `color.text-on-dark`: `#FFFFFF`
- `color.text-secondary`: `#DCDDE3`
- `color.text-muted`: `#91919F`
- `color.positive`: `#32E68A`
- `color.negative`: `#FF4F66`

---

### 2.2. Tipografia

Fonte sugerida:

- iOS: **SF Pro** (Text/Display)
- Web/Android: **Inter**, **Poppins** ou **Nunito**

**Tokens de tipografia**

- `font.display-number`: 32–36px, semibold/bold (saldos, totais).
- `font.title`: 20–22px, semibold (títulos de seção).
- `font.body`: 14–16px, regular/medium (textos principais).
- `font.caption`: 12–13px, regular (datas, rótulos, percentuais).

**Desktop:**  
- Pode subir levemente os tamanhos:
  - `font.display-number-desktop`: 40–48px.
  - `font.title-desktop`: 22–24px.
  - `font.body-desktop`: 16px.

---

## 3. Espaçamentos, raios e sombras

- `spacing.xs`: 4 px
- `spacing.sm`: 8 px
- `spacing.md`: 16 px
- `spacing.lg`: 20 px
- `spacing.xl`: 24 px
- `spacing.page-mobile`: 16–20 px (margens laterais).
- `spacing.page-desktop`: 24–40 px + container central com max-width (ex.: 1200–1440 px).

- `radius.sm`: 12 px
- `radius.md`: 16 px
- `radius.lg`: 24 px
- `radius.xl`: 32 px
- `radius.pill`: 999 px (botões e chips em formato de pílula)

**Sombras padrão**

- `shadow.card`: `0 20px 45px rgba(3, 6, 27, 0.8)`
- `shadow.nav`: sombra mais suave mas larga, simulando barra “flutuando”.

---

## 4. Breakpoints & comportamento responsivo

### 4.1. Breakpoints sugeridos

- **Mobile:** `0–767px`
- **Tablet:** `768–1023px`
- **Desktop:** `≥ 1024px` (ou 1200px, se quiser mais folga)

### 4.2. Princípios de responsividade

1. **Mobile first:**  
   - Todos os componentes devem funcionar perfeitamente em 1 coluna.
   - Scroll vertical como padrão.

2. **Tablet:**  
   - Começar a dividir cards em 2 colunas quando fizer sentido (ex.: saldo + gráfico lado a lado).
   - Navbar pode continuar embaixo ou migrar para topo conforme o produto exigir.

3. **Desktop:**  
   - Transformar as telas em **layouts de dashboard**:
     - `Home`: saldo à esquerda, cartões no centro, grupos à direita.
     - `Estatísticas`: gráfico no centro, filtros no topo, transações em coluna lateral.
   - **Navbar inferior** vira:
     - Ou **sidebar esquerda** com ícones + labels.
     - Ou **topbar horizontal** com tabs.

---

## 5. Padrões de Layout (Mobile & Desktop)

### 5.1. Tela Home – Dashboard / Saldo

**Objetivo:** visualização rápida do saldo, ações de enviar/receber e cartões.

#### Mobile

- Margens horizontais: `spacing.page-mobile`.
- Ordem em coluna:
  1. Header com avatar + notificação.
  2. Bloco de saldo.
  3. Card de ações (Send / botão central / Request).
  4. Seção “My cards”.
  5. Seção “Pay by groups”.
  6. Navbar inferior.

#### Desktop

- Container central com max-width (ex.: 1280 px).
- Layout em **3 colunas principais**:

  - **Coluna esquerda (25–30%)**
    - Header com avatar, saudação.
    - Bloco de saldo principal.

  - **Coluna central (40–50%)**
    - Card de ações (Send / Request).
    - Lista de cartões (carrossel horizontal ou grid 2x2).

  - **Coluna direita (25–30%)**
    - “Pay by groups” com lista vertical ou grid de grupos.
    - Atalhos rápidos (ex.: últimos contatos, faturas).

- **Navbar inferior** substituída por:
  - **Sidebar à esquerda** com ícones grandes e labels.
    - Item ativo com pill verde.
    - Itens inativos em azul escuro.
  - Ou **topbar** logo acima do dashboard com tabs.

---

### 5.2. Tela Hero / Login – Onboarding

**Objetivo:** comunicar confiança e converter para login/cadastro.

#### Mobile

- Fundo gradiente azul + glow roxo.
- Em coluna, centralizado:

  1. Header com logo à esquerda e texto (“Free Trial”) à direita.
  2. Chip “Trade Crypto Anytime” (topo).
  3. Título grande em 2–3 linhas.
  4. Subtítulo curto.
  5. Card de gráfico (Expenses) centralizado.
  6. Botões `Log in` e `Sign up` em full-width (empilhados).

#### Desktop

- Divisão horizontal em **2 blocos**:

  - **Esquerda (40–50%) – Texto**
    - Logo + tagline superior.
    - Título grande.
    - Subtítulo.
    - Alguns bullets rápidos (benefícios do app).

  - **Direita (50–60%) – Card hero**
    - Card de gráfico maior, com animação leve (se possível).
    - Mini cards flutuando com métricas (ex.: “+7.2% saving this month”).

- Botões principais sempre visíveis:
  - Embaixo do texto à esquerda (`Log in`, `Sign up` lado a lado).
- Em desktop, usar **hover states** claros:
  - Botão primário: leve aumento de brilho/sombra.
  - Botão secundário: borda clareia e texto ganha opacidade total.

---

### 5.3. Tela Estatísticas – Money Spent

**Objetivo:** visão macro dos gastos + transações recentes.

#### Mobile

- Ordem em coluna:

  1. Header (voltar, título “Statistic”, botão info).
  2. Filtros e resumo de gastos (Total/Monthly/Daily + seletor Yearly).
  3. Gráfico de fluxo (categorias → contas/apps) com tooltip.
  4. Seção “Recent Transactions” (lista vertical).
  5. Navbar inferior.

#### Desktop

- Layout tipo **dashboard analítico**:

  - **Topo (full width)**
    - Header com título “Money Spent”.
    - Filtros (período, tipo de conta, moeda) alinhados à direita.

  - **Centro em 2 colunas principais**
    - **Esquerda (60–65%)**
      - Gráfico de fluxo grande, ocupando altura considerável.
      - Tooltip visível ao hover, com transição suave.

    - **Direita (35–40%)**
      - Card “Resumo” com:
        - Total amount, Monthly, Daily em destaque.
        - Pequeno gráfico de linhas/barras complementando.
      - Abaixo: “Recent Transactions” com lista scrollável dentro do card (altura fixa).

- Navbar:
  - Sidebar ou topbar, como definido para o produto.

---

## 6. Componentes de UI (Biblioteca)

### 6.1. Card Glass

**Uso:** blocos de saldo, gráficos, cartões, seções principais.

```pseudo
CardGlass {
  background: rgba(12, 20, 60, 0.85);
  backdrop-filter: blur(20–30px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: radius.lg ou radius.xl;
  box-shadow: shadow.card;
  padding: spacing.lg;
}
