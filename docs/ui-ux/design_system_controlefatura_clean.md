# Design System – ControleFatura

Este documento apresenta o **Design System** para o domínio **controlefatura.ia.br**.  Ele foi elaborado a partir de pesquisas recentes sobre design de sites financeiros e tendências minimalistas.  O objetivo é proporcionar uma experiência de usuário (UI/UX) simples, intuitiva e confiável, alinhada às melhores práticas de acessibilidade e segurança.  As seções abaixo descrevem a identidade visual (paleta de cores, tipografia, logotipo e favicon), componentes de interface, layout, microcopy e orientações de acessibilidade.

## Visão geral do design

### Valores-chave

- **Transparência e confiança** – Utilizar cores sóbrias e elementos visuais que reforçam segurança e estabilidade financeira.  Pesquisas mostram que usuários confiam mais quando o design é claro, com dados e gráficos explícitos.
- **Simplicidade e clareza** – Layouts minimalistas, tipografia legível e uso de espaço em branco facilitam a compreensão e reduzem a carga cognitiva.  Isso permite que o usuário foque nas informações financeiras importantes.
- **Humanização** – Inserir elementos que mostrem que há pessoas por trás do serviço (fotos, linguagem conversacional, depoimentos) para aproximar o usuário.
- **Reforço de desempenho** – Transmitir segurança e estabilidade através de gráficos e tabelas transparentes, mostrando tarifas e resultados de forma visual.

## Paleta de cores

Uma paleta bem definida transmite confiança e cria harmonia visual.  O estudo sobre cores em marcas financeiras destaca que **azul** transmite confiança e estabilidade, enquanto **verde** sugere crescimento e sucesso.  A paleta a seguir utiliza tons neutros para fundo e contrastes adequados:

| Nome da cor           | Hex       | Uso principal                                  |
|-----------------------|-----------|-----------------------------------------------|
| **Azul Escuro**       | `#0F3B57` | Cor de fundo principal do site (modo claro).  Evoca confiança e profissionalismo. |
| **Azul Médio**        | `#1D5A8F` | Barras de navegação, cabeçalhos e links ativos. |
| **Verde Esmeralda**   | `#2C8A4B` | Destaques positivos, gráficos de crescimento e botões primários. Remete a prosperidade e crescimento. |
| **Cinza Claro**       | `#F5F7FA` | Plano de fundo de cartões e seções para criar contraste suave. |
| **Cinza Médio**       | `#B0BEC5` | Bordas, divisórias e textos secundários. |
| **Branco**            | `#FFFFFF` | Fundo em áreas de conteúdo e contraste máximo. |
| **Alerta Vermelho**   | `#C62828` | Estados de erro ou avisos críticos. Usado com moderação para evitar ansiedade. |

### Diretrizes de uso de cores

1. **Limite de tons** – Use no máximo três tons principais (azul, verde e cinza) e um tom de alerta para evitar sobrecarregar o usuário.
2. **Contraste** – Mantenha relação de contraste mínima de 4,5:1 para textos. Teste o contraste em modo claro e escuro.
3. **Fundo neutro** – Use branco ou cinza claro para áreas grandes, permitindo que as cores de destaque guiem a atenção.
4. **Modo escuro** – Para usuários que preferem modo noturno, inverta o plano de fundo para azul escuro, use verde esmeralda e tons de cinza para contraste e mantenha a legibilidade.

## Tipografia

### Fontes recomendadas

| Papel                | Fonte (Google Fonts) | Características                                  |
|----------------------|----------------------|--------------------------------------------------|
| **Títulos**          | **Merriweather**     | Serif legível que transmite tradição e credibilidade, adequado para títulos e destaques. |
| **Texto principal**  | **Inter**            | Sans-serif moderno e neutro que facilita a leitura em telas e sugere acessibilidade. |
| **Dados/Numérico**   | **Roboto Mono**      | Monoespaçada para tabelas e códigos de barras; facilita alinhamento de números. |

### Hierarquia e estilo

| Nível      | Peso/tamanho sugerido | Uso                                |
|------------|----------------------|------------------------------------|
| **H1**     | 36 px, semibold      | Títulos de páginas.                |
| **H2**     | 28 px, semibold      | Subtítulos ou seções principais.   |
| **H3**     | 22 px, medium        | Cabeçalhos de cartões ou tabelas.  |
| **Corpo**  | 16 px, regular       | Textos de parágrafos e instruções. |
| **Legendas** | 14 px, regular     | Notas de rodapé, textos auxiliares.|

- **Consistência** – Utilize no máximo duas famílias tipográficas para manter coesão visual.
- **Espaçamento** – Use espaçamento generoso entre linhas (1,5 × o tamanho do texto) e margens amplas para aumentar a legibilidade.
- **Contraste tipográfico** – Combine serif (Merriweather) e sans-serif (Inter) para criar hierarquia e destacar títulos, mantendo a harmonia.

## Layout e espaçamento

### Grade e colunas

- **Grade de 12 colunas** – Adote uma grade fluida de 12 colunas para desktop e 4 colunas para dispositivos móveis.  Isso facilita a distribuição dos elementos e mantém o alinhamento.
- **Margens fluidas** – Em telas maiores, utilize margens de 5–8 % para evitar que o conteúdo fique colado às bordas.  Em dispositivos móveis, reduza para 4 %.
- **Espaço em branco (negative space)** – O uso intencional de espaço em branco define a estrutura, hierarquia e melhora a experiência de leitura.  Utilize mais espaço ao redor de elementos importantes e menos em grupos relacionados.

### Responsividade

| Tamanho de tela        | Breakpoint (px) | Layout                                         |
|------------------------|-----------------|------------------------------------------------|
| **Mobile**             | 0–600          | Navegação inferior com até 4 ícones; cards em coluna única; texto de 14–16 px. |
| **Tablet**             | 601–960        | Menu lateral retrátil; duas colunas de cards. |
| **Desktop**            | 961–1400       | Cabeçalho fixo com logo e menu; até 3 ou 4 colunas de cards. |
| **Grande (Wide)**      | 1401+          | Conteúdo centralizado com colunas de suporte; uso equilibrado de espaço em branco. |

### Navegação

- **Barra superior (desktop)** – Incluir logotipo, menu principal (Dashboard, Faturas, Transações, Configurações) e botão de login/perfil.  O menu deve ser claro e direto, pois uma navegação intuitiva é essencial nos sites financeiros.
- **Navegação inferior (mobile)** – Posicionar 4 ícones principais (Dashboard, Faturas, Carteiras, Perfil) ao alcance do polegar direito para melhorar a usabilidade em dispositivos móveis.
- **Breadcumbs** – Para etapas complexas (ex.: fluxo de pagamento), utilizar breadcrumbs ou indicadores de progresso para orientar o usuário.

## Componentes de interface

### Botões

| Tipo de botão        | Cor de fundo        | Cor do texto | Uso principal                                   |
|----------------------|----------------------|--------------|------------------------------------------------|
| **Primário**         | Verde Esmeralda (`#2C8A4B`) | Branco       | Ações principais (ex.: “Pagar Fatura”, “Confirmar”). |
| **Secundário**       | Azul Médio (`#1D5A8F`)        | Branco       | Ações complementares (“Ver Detalhes”).         |
| **Tertiário (Texto)**| Transparente        | Azul Médio   | Links ou ações de baixo impacto (“Cancelar”).    |
| **Desabilitado**     | Cinza Médio (`#B0BEC5`)        | Branco       | Estados indisponíveis (botão inativo).         |

- Bordas arredondadas de 8 px aumentam a percepção de modernidade.
- Estados de foco e hover devem alterar levemente a tonalidade (10 % mais clara ou escura) e adicionar sombra suave para indicar interação.
- Para acessibilidade, o foco deve ser visível por meio de borda extra ou contorno contrastante (ex.: azul claro).

### Campos de formulário

- **Rótulos claros** – Posicione rótulos fora do campo, com tipografia de 14 px, para evitar confusão.  Os rótulos não devem desaparecer ao preencher o campo (evitar *placeholders* como único rótulo).
- **Estados** – Use bordas verdes para entrada válida, vermelhas para erros e azul médio para foco.  Mensagens de erro devem ser claras e amigáveis, explicando o que precisa ser corrigido.
- **Agrupamento** – Agrupe campos relacionados com espaçamento de 16 px e separadores visuais, facilitando a leitura.

### Cartões (Cards)

Cartões são contêineres para informações como faturas, contas ou gráficos.

- **Fundo**: Cinza Claro (`#F5F7FA`) com sombra suave para separação.
- **Cabeçalho**: Título em H3 com ícone opcional à esquerda.
- **Corpo**: Valores em destaque (por exemplo, saldo) em tamanho 24 px e detalhes secundários em 14–16 px.
- **Rodapé**: CTA (botão) ou links para ações adicionais.

### Tabelas

- Use linhas alternadas em tons de cinza claro para diferenciar linhas e melhorar a leitura.
- Cabeçalhos em bold (16 px) e corpo em regular (14 px).
- Permitir ordenação e filtros para facilitar a navegação por grandes quantidades de dados.

### Gráficos

- Utilizar gráficos de barras, linhas ou pizza para apresentar dados financeiros de forma intuitiva. As cores devem seguir a paleta (verde para crescimento, vermelho para queda).  Evite excesso de detalhes; valores-chave devem ser evidentes.

### Modais e diálogos

- Abrir modais centralizados com sobreposição semitransparente de fundo.
- O título deve resumir a ação (ex.: “Confirmar Pagamento”).
- Botões “Confirmar” (primário) e “Cancelar” (terciário) devem estar alinhados à direita.

## Microcopy e tom de voz

O tom de voz da plataforma deve ser **humano, transparente e calmo**.  Evite jargões técnicos e linguagem jurídica complexa.  Prefira frases curtas e empáticas, usando o pronome “você” para criar proximidade.  Exemplos:

- **Mensagem de boas-vindas**: “Olá, [Nome]! Estamos aqui para ajudar você a acompanhar suas faturas.”
- **Confirmação de pagamento**: “Pagamento realizado com sucesso. Obrigado por confiar na ControleFatura.”
- **Alerta de erro**: “Não foi possível processar sua solicitação. Verifique seus dados e tente novamente.”

Adicionar micro-animações sutis (ex.: ícones de carregamento ou transições suaves) para indicar progresso ou sucesso melhora a experiência, mas deve ser feito de forma discreta.

## Acessibilidade e inclusão

Conforme as diretrizes WCAG 2.2 e exigências legais para sites financeiros, aplique as seguintes práticas:

1. **Contraste de cores** – Mantenha contraste mínimo 4,5:1 para textos e 3:1 para ícones e componentes.
2. **Textos alternativos** – Forneça *alt* em imagens e ícones, descrevendo o conteúdo de forma concisa.
3. **Navegação por teclado** – Certifique-se de que todos os elementos interativos podem ser acessados via teclado (Tab, Shift+Tab).  Defina a ordem lógica de foco.
4. **Rotulagem de formulários** – Campos de entrada devem ter `label` associado e `aria-describedby` para mensagens de erro.
5. **Responsividade e zoom** – A interface deve permitir zoom de até 200 % sem perda de funcionalidade.
6. **Feedback de status** – Indique status de carregamento e confirmação (ex.: spinner, check de sucesso) para que usuários saibam que a ação foi registrada.

## Identidade visual

### Logotipo

O logotipo da **ControleFatura** foi concebido para transmitir crescimento financeiro e controle.  O símbolo combina a letra “C” com um gráfico de barras e uma seta ascendente, em verde esmeralda sobre fundo azul escuro.  A tipografia do nome usa fonte sans-serif moderna e branca para máxima legibilidade.

![Logotipo ControleFatura](../../public/logo.png)

- **Construção** – O ícone é composto por três barras ascendentes e uma seta, integrados a um “C” estilizado, representando progresso e estabilidade.  A descrição do logotipo baseia‑se em exemplos de logos financeiros que usam gráficos abstratos para simbolizar crescimento e precisão.
- **Proporção e área de proteção** – Reserve uma margem igual à altura da seta ao redor do logotipo para evitar que elementos concorram com a marca.
- **Versões** – Disponibilize versões: horizontal (símbolo + texto) e ícone isolado (para avatars e favicons).  Mantenha boa legibilidade em tamanhos pequenos.

### Favicon

Para garantir compatibilidade em todos os dispositivos, crie favicons nos seguintes tamanhos essenciais:

- `favicon.ico` contendo 16 × 16 px e 32 × 32 px.
- `apple-touch-icon.png` de 180 × 180 px para iOS.
- `android-chrome-192x192.png` de 192 × 192 px para Android.
- `android-chrome-512x512.png` de 512 × 512 px para PWAs.

Recomenda‑se iniciar com o ícone mestre de 512 × 512 px e gerar as demais dimensões.  Use formas simples sem detalhes finos e evite textos.  Inclua as seguintes tags no `<head>` do site:

<details>
<summary>Snippet para o &lt;head&gt;</summary>

```html
<!-- Configuração de favicon essencial -->
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
```

</details>

### Slogan (opcional)

“**Controle suas faturas com inteligência.**”  Esse slogan reforça a proposta de valor e complementa a marca.

## Páginas e fluxos principais

### Home / Dashboard

Apresenta visão geral das faturas e do saldo.  Componentes:

- **Resumo de faturas** – Card com valor total a pagar e botão “Pagar agora”.
- **Gráfico de despesas** – Gráfico de barras ou pizza mostrando gastos por categoria (ex.: “Alimentação”, “Transporte”, “Outros”).
- **Alertas** – Mensagens sobre faturas vencidas ou promoções.
- **Menu rápido** – Ícones para Faturas, Transações, Cartões, Suporte.

### Página de Faturas

- **Lista de faturas** – Tabela com colunas “Data de vencimento”, “Valor”, “Situação” (Pendente, Pago).  Permitir filtros e busca.
- **Detalhe da fatura** – Ao clicar em uma fatura, mostrar detalhes como itens, datas de compra, juros, opções de pagamento parcelado.
- **Pagamento** – Formulário seguro para inserir dados de pagamento e confirmar a transação.

### Transações

Página com histórico de transações (pagamentos efetuados, estornos), incluindo filtros por data e tipo.

### Configurações

Usuário pode atualizar dados pessoais, métodos de pagamento, preferências de notificação e ativar modo escuro.

## Tokens de design (CSS)

Para facilitar a implementação, utilize variáveis CSS (custom properties) para cores, tipografia e espaçamento:

```css
:root {
  /* Cores */
  --color-primary: #2C8A4B;
  --color-secondary: #1D5A8F;
  --color-background: #F5F7FA;
  --color-surface: #FFFFFF;
  --color-on-primary: #FFFFFF;
  --color-on-secondary: #FFFFFF;
  --color-error: #C62828;
  --color-on-error: #FFFFFF;
  --color-text-primary: #0F3B57;
  --color-text-secondary: #4A657D;
  /* Tipografia */
  --font-title: 'Merriweather', serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'Roboto Mono', monospace;
  /* Espaçamento */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --radius: 8px;
}
```

## Considerações finais

Um design de interface para serviços financeiros precisa ser um equilíbrio entre segurança, clareza e simplicidade.  Este design system oferece orientações completas de cores, tipografia, layout, componentes, microcopy e acessibilidade, alinhadas às tendências de 2026 e à psicologia das cores e do comportamento do usuário.  Ao implementá‑lo no **controlefatura.ia.br**, desenvolvedores e designers garantirão uma experiência consistente e confiável que atende às expectativas dos usuários e cumpre requisitos regulatórios.
