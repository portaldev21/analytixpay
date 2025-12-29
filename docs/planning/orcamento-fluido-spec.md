# Sistema de Orçamento Fluido (Rolling Budget)

## Especificação Técnica Completa

**Versão**: 1.0  
**Data**: Dezembro 2024  
**Autor**: Vitor (Micro-SaaS PRO)

---

## 1. Visão Geral

### 1.1 Conceito Central

O Sistema de Orçamento Fluido é uma ferramenta de gestão financeira pessoal onde o orçamento diário se ajusta dinamicamente baseado nos gastos dos dias anteriores dentro do mesmo ciclo (semana/mês).

**Princípio fundamental**: Economia é recompensada com mais flexibilidade futura; excesso é compensado com restrição futura.

### 1.2 Proposta de Valor

- Usuário define apenas UM valor: a **base diária**
- Sistema calcula automaticamente orçamentos semanal e mensal
- Gastos abaixo do orçamento "sobram" para os próximos dias
- Gastos acima do orçamento são "emprestados" dos próximos dias
- Redistribuição automática e transparente

---

## 2. Glossário e Terminologia

| Termo | Definição | Exemplo |
|-------|-----------|---------|
| **Base Diária** | Valor padrão definido pelo usuário para gastos diários (input principal) | R$ 100,00 |
| **Orçamento Disponível** | Valor real que o usuário pode gastar hoje (ajustado pela diluição) | R$ 103,33 |
| **Saldo Residual** | Diferença entre orçamento disponível e gasto real do dia | +R$ 20,00 ou -R$ 50,00 |
| **Saldo Acumulado** | Soma de todos os saldos residuais do ciclo até o momento | +R$ 45,00 |
| **Diluição** | Processo de distribuir o saldo residual entre os dias restantes do ciclo | R$ 20 ÷ 5 dias = R$ 4/dia |
| **Ciclo Semanal** | Período de 7 dias para cálculo de diluição primária | Segunda a Domingo |
| **Ciclo Mensal** | Período do mês para visão macro do orçamento | 1 a 31 de Janeiro |
| **Dias Restantes** | Quantidade de dias que faltam no ciclo (incluindo hoje) | 4 dias |

---

## 3. Regras de Negócio

### 3.1 Configuração Inicial

```
ENTRADA DO USUÁRIO:
└── Base Diária = R$ X (único input obrigatório)

DERIVAÇÕES AUTOMÁTICAS:
├── Orçamento Semanal = Base Diária × 7
├── Orçamento Mensal = Base Diária × dias_do_mês_atual
└── Orçamento Anual = Base Diária × 365 (informativo)
```

**Exemplo com Base Diária = R$ 100:**
- Semanal: R$ 700
- Mensal (30 dias): R$ 3.000
- Mensal (31 dias): R$ 3.100

### 3.2 Fórmula Principal: Orçamento Disponível

```
Orçamento_Disponível_Hoje = Base_Diária + (Saldo_Acumulado ÷ Dias_Restantes_Ciclo)
```

**Onde:**
- `Base_Diária` = valor configurado pelo usuário
- `Saldo_Acumulado` = soma de todos os saldos residuais dos dias anteriores no ciclo
- `Dias_Restantes_Ciclo` = dias que faltam na semana, incluindo hoje

### 3.3 Cálculo do Saldo Residual Diário

```
Saldo_Residual = Orçamento_Disponível - Gasto_Real

INTERPRETAÇÃO:
├── Se positivo → economia (crédito para o futuro)
├── Se negativo → excesso (débito do futuro)
└── Se zero → equilíbrio perfeito
```

### 3.4 Regra de Diluição

O saldo residual é **diluído igualmente** entre os dias restantes do ciclo semanal.

```
Ajuste_Por_Dia = Saldo_Acumulado ÷ Dias_Restantes

APLICAÇÃO:
├── Crédito de R$ 20 com 5 dias restantes = +R$ 4/dia
└── Débito de R$ 50 com 5 dias restantes = -R$ 10/dia
```

### 3.5 Regras de Virada de Ciclo

#### Virada de Semana
```
OPÇÕES (definir na implementação):

Opção A - Reset Total:
└── Saldo acumulado zera, semana começa limpa

Opção B - Arrastar Tudo:
└── Saldo (positivo ou negativo) vai para próxima semana

Opção C - Arrastar Apenas Déficit:
├── Saldo negativo → arrasta (responsabilidade)
└── Saldo positivo → zera (recompensa por economia)

Opção D - Arrastar Apenas Crédito:
├── Saldo positivo → arrasta (poupança)
└── Saldo negativo → zera (perdão)
```

#### Virada de Mês
```
RECOMENDAÇÃO:
└── Mês serve como visão macro, diluição principal é semanal
└── Dashboard mostra progresso mensal como informativo
└── Pode ter regras próprias se desejado
```

---

## 4. Exemplos Práticos

### 4.1 Semana Equilibrada

**Config**: Base = R$ 100 | Início = Segunda

| Dia | Disponível | Gasto | Saldo Dia | Acumulado | Cálculo |
|-----|------------|-------|-----------|-----------|---------|
| Seg | R$ 100,00 | R$ 80,00 | +R$ 20,00 | +R$ 20,00 | Base inicial |
| Ter | R$ 103,33 | R$ 100,00 | +R$ 3,33 | +R$ 23,33 | 100 + (20÷6) |
| Qua | R$ 104,67 | R$ 110,00 | -R$ 5,33 | +R$ 18,00 | 100 + (23,33÷5) |
| Qui | R$ 104,50 | R$ 100,00 | +R$ 4,50 | +R$ 22,50 | 100 + (18÷4) |
| Sex | R$ 107,50 | R$ 120,00 | -R$ 12,50 | +R$ 10,00 | 100 + (22,50÷3) |
| Sáb | R$ 105,00 | R$ 90,00 | +R$ 15,00 | +R$ 25,00 | 100 + (10÷2) |
| Dom | R$ 125,00 | R$ 125,00 | R$ 0,00 | R$ 0,00 | 100 + (25÷1) |

**Total**: R$ 725,00 gasto de R$ 700 disponível → Déficit de R$ 25 absorvido

### 4.2 Semana com Gasto Excessivo no Início

**Config**: Base = R$ 100 | Início = Segunda

| Dia | Disponível | Gasto | Saldo Dia | Acumulado | Cálculo |
|-----|------------|-------|-----------|-----------|---------|
| Seg | R$ 100,00 | R$ 200,00 | -R$ 100,00 | -R$ 100,00 | Base inicial |
| Ter | R$ 83,33 | R$ 80,00 | +R$ 3,33 | -R$ 96,67 | 100 + (-100÷6) |
| Qua | R$ 80,67 | R$ 80,00 | +R$ 0,67 | -R$ 96,00 | 100 + (-96,67÷5) |
| Qui | R$ 76,00 | R$ 70,00 | +R$ 6,00 | -R$ 90,00 | 100 + (-96÷4) |
| Sex | R$ 70,00 | R$ 70,00 | R$ 0,00 | -R$ 90,00 | 100 + (-90÷3) |
| Sáb | R$ 55,00 | R$ 50,00 | +R$ 5,00 | -R$ 85,00 | 100 + (-90÷2) |
| Dom | R$ 15,00 | R$ 15,00 | R$ 0,00 | -R$ 85,00 | 100 + (-85÷1) |

**Total**: R$ 565,00 gasto de R$ 700 disponível → Economia forçada de R$ 135

### 4.3 Semana Econômica

**Config**: Base = R$ 100 | Início = Segunda

| Dia | Disponível | Gasto | Saldo Dia | Acumulado | Cálculo |
|-----|------------|-------|-----------|-----------|---------|
| Seg | R$ 100,00 | R$ 50,00 | +R$ 50,00 | +R$ 50,00 | Base inicial |
| Ter | R$ 108,33 | R$ 60,00 | +R$ 48,33 | +R$ 98,33 | 100 + (50÷6) |
| Qua | R$ 119,67 | R$ 70,00 | +R$ 49,67 | +R$ 148,00 | 100 + (98,33÷5) |
| Qui | R$ 137,00 | R$ 80,00 | +R$ 57,00 | +R$ 205,00 | 100 + (148÷4) |
| Sex | R$ 168,33 | R$ 100,00 | +R$ 68,33 | +R$ 273,33 | 100 + (205÷3) |
| Sáb | R$ 236,67 | R$ 150,00 | +R$ 86,67 | +R$ 360,00 | 100 + (273,33÷2) |
| Dom | R$ 460,00 | R$ 300,00 | +R$ 160,00 | +R$ 520,00 | 100 + (360÷1) |

**Total**: R$ 810,00 gasto de R$ 700 + R$ 520 acumulado como crédito

---

## 5. Estrutura de Dados

### 5.1 Tabela: budget_configs

```sql
CREATE TABLE budget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  daily_base DECIMAL(10,2) NOT NULL,
  week_start_day INTEGER DEFAULT 1, -- 0=Dom, 1=Seg, 2=Ter...
  carry_over_mode VARCHAR(20) DEFAULT 'reset', -- reset, carry_all, carry_deficit, carry_credit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_budget_configs_user ON budget_configs(user_id);
CREATE INDEX idx_budget_configs_active ON budget_configs(user_id, is_active);
```

### 5.2 Tabela: week_cycles

```sql
CREATE TABLE week_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  config_id UUID NOT NULL REFERENCES budget_configs(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_budget DECIMAL(10,2) NOT NULL, -- daily_base × 7
  carried_balance DECIMAL(10,2) DEFAULT 0, -- Saldo trazido da semana anterior
  accumulated_balance DECIMAL(10,2) DEFAULT 0, -- Saldo acumulado atual
  status VARCHAR(20) DEFAULT 'active', -- active, closed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_week_cycles_user ON week_cycles(user_id);
CREATE INDEX idx_week_cycles_active ON week_cycles(user_id, status);
CREATE INDEX idx_week_cycles_dates ON week_cycles(start_date, end_date);
```

### 5.3 Tabela: daily_records

```sql
CREATE TABLE daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  cycle_id UUID NOT NULL REFERENCES week_cycles(id),
  record_date DATE NOT NULL,
  base_budget DECIMAL(10,2) NOT NULL, -- Base diária no momento
  available_budget DECIMAL(10,2) NOT NULL, -- Orçamento calculado
  total_spent DECIMAL(10,2) DEFAULT 0,
  daily_balance DECIMAL(10,2) DEFAULT 0, -- available - spent
  remaining_days INTEGER NOT NULL, -- Dias restantes no momento do cálculo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, record_date)
);

-- Índices
CREATE INDEX idx_daily_records_user ON daily_records(user_id);
CREATE INDEX idx_daily_records_cycle ON daily_records(cycle_id);
CREATE INDEX idx_daily_records_date ON daily_records(record_date);
```

### 5.4 Tabela: expenses

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  daily_record_id UUID NOT NULL REFERENCES daily_records(id),
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  expense_date DATE NOT NULL,
  expense_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_daily ON expenses(daily_record_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);
```

### 5.5 Tabela: expense_categories (opcional)

```sql
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Tipos TypeScript

```typescript
// ============================================
// TIPOS PRINCIPAIS
// ============================================

interface BudgetConfig {
  id: string;
  user_id: string;
  daily_base: number;
  week_start_day: WeekDay;
  carry_over_mode: CarryOverMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WeekCycle {
  id: string;
  user_id: string;
  config_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  initial_budget: number;
  carried_balance: number;
  accumulated_balance: number;
  status: CycleStatus;
  created_at: string;
  updated_at: string;
}

interface DailyRecord {
  id: string;
  user_id: string;
  cycle_id: string;
  record_date: string;
  base_budget: number;
  available_budget: number;
  total_spent: number;
  daily_balance: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
}

interface Expense {
  id: string;
  user_id: string;
  daily_record_id: string;
  amount: number;
  category?: string;
  description?: string;
  expense_date: string;
  expense_time?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENUMS E TIPOS AUXILIARES
// ============================================

type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 1=Seg...

type CarryOverMode = 
  | 'reset'        // Zera tudo na virada
  | 'carry_all'    // Arrasta positivo e negativo
  | 'carry_deficit' // Só arrasta negativo
  | 'carry_credit'; // Só arrasta positivo

type CycleStatus = 'active' | 'closed';

// ============================================
// DTOs E RESPONSES
// ============================================

interface TodayBudgetResponse {
  date: string;
  available_budget: number;
  base_budget: number;
  adjustment: number; // Diferença (positiva ou negativa)
  total_spent_today: number;
  remaining_today: number;
  cycle_info: {
    days_remaining: number;
    accumulated_balance: number;
    week_start: string;
    week_end: string;
  };
  status: BudgetStatus;
}

type BudgetStatus = 
  | 'above_base'  // Orçamento acima da base (tem crédito)
  | 'at_base'     // Orçamento igual à base
  | 'below_base'  // Orçamento abaixo da base (tem débito)
  | 'critical';   // Orçamento muito baixo (< 50% da base)

interface AddExpenseRequest {
  amount: number;
  category?: string;
  description?: string;
  date?: string; // Se não informado, usa hoje
  time?: string;
}

interface AddExpenseResponse {
  expense: Expense;
  updated_daily: DailyRecord;
  new_available_budget: number;
  message: string;
}

interface WeekSummary {
  cycle: WeekCycle;
  daily_records: DailyRecord[];
  total_budget: number;
  total_spent: number;
  total_saved: number;
  average_daily_spent: number;
  days_over_budget: number;
  days_under_budget: number;
}
```

---

## 7. Funções de Cálculo

```typescript
// ============================================
// FUNÇÕES CORE DE CÁLCULO
// ============================================

/**
 * Calcula o orçamento disponível para hoje
 */
function calculateAvailableBudget(
  dailyBase: number,
  accumulatedBalance: number,
  remainingDays: number
): number {
  if (remainingDays <= 0) return dailyBase;
  
  const adjustment = accumulatedBalance / remainingDays;
  return Math.round((dailyBase + adjustment) * 100) / 100;
}

/**
 * Calcula o saldo residual do dia
 */
function calculateDailyBalance(
  availableBudget: number,
  totalSpent: number
): number {
  return Math.round((availableBudget - totalSpent) * 100) / 100;
}

/**
 * Calcula dias restantes na semana
 */
function calculateRemainingDays(
  currentDate: Date,
  cycleEndDate: Date
): number {
  const diffTime = cycleEndDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // +1 porque inclui hoje
}

/**
 * Calcula datas do ciclo semanal
 */
function calculateWeekCycleDates(
  referenceDate: Date,
  weekStartDay: number
): { start: Date; end: Date } {
  const current = new Date(referenceDate);
  const currentDay = current.getDay();
  
  // Calcular início da semana
  let daysToSubtract = currentDay - weekStartDay;
  if (daysToSubtract < 0) daysToSubtract += 7;
  
  const start = new Date(current);
  start.setDate(current.getDate() - daysToSubtract);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Determina o status do orçamento
 */
function getBudgetStatus(
  availableBudget: number,
  dailyBase: number
): BudgetStatus {
  const ratio = availableBudget / dailyBase;
  
  if (ratio < 0.5) return 'critical';
  if (ratio < 1) return 'below_base';
  if (ratio > 1) return 'above_base';
  return 'at_base';
}

/**
 * Calcula orçamento semanal e mensal
 */
function calculateDerivedBudgets(dailyBase: number, month?: number, year?: number) {
  const weekly = dailyBase * 7;
  
  let monthly = dailyBase * 30; // Padrão
  if (month !== undefined && year !== undefined) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    monthly = dailyBase * daysInMonth;
  }
  
  return {
    daily: dailyBase,
    weekly,
    monthly,
    yearly: dailyBase * 365
  };
}
```

---

## 8. Fluxos de Implementação

### 8.1 Fluxo: Obter Orçamento de Hoje

```typescript
async function getTodayBudget(userId: string): Promise<TodayBudgetResponse> {
  // 1. Buscar configuração ativa do usuário
  const config = await getActiveConfig(userId);
  if (!config) throw new Error('Configuração não encontrada');
  
  // 2. Buscar ou criar ciclo semanal ativo
  const today = new Date();
  let cycle = await getActiveCycle(userId, today);
  
  if (!cycle) {
    cycle = await createNewCycle(userId, config, today);
  }
  
  // 3. Buscar ou criar registro do dia
  let dailyRecord = await getDailyRecord(userId, today);
  
  if (!dailyRecord) {
    // Calcular orçamento disponível
    const remainingDays = calculateRemainingDays(today, new Date(cycle.end_date));
    const availableBudget = calculateAvailableBudget(
      config.daily_base,
      cycle.accumulated_balance,
      remainingDays
    );
    
    dailyRecord = await createDailyRecord({
      user_id: userId,
      cycle_id: cycle.id,
      record_date: today,
      base_budget: config.daily_base,
      available_budget: availableBudget,
      remaining_days: remainingDays
    });
  }
  
  // 4. Montar resposta
  return {
    date: dailyRecord.record_date,
    available_budget: dailyRecord.available_budget,
    base_budget: dailyRecord.base_budget,
    adjustment: dailyRecord.available_budget - dailyRecord.base_budget,
    total_spent_today: dailyRecord.total_spent,
    remaining_today: dailyRecord.available_budget - dailyRecord.total_spent,
    cycle_info: {
      days_remaining: dailyRecord.remaining_days,
      accumulated_balance: cycle.accumulated_balance,
      week_start: cycle.start_date,
      week_end: cycle.end_date
    },
    status: getBudgetStatus(dailyRecord.available_budget, config.daily_base)
  };
}
```

### 8.2 Fluxo: Registrar Gasto

```typescript
async function addExpense(
  userId: string,
  request: AddExpenseRequest
): Promise<AddExpenseResponse> {
  const expenseDate = request.date ? new Date(request.date) : new Date();
  
  // 1. Buscar registro do dia (deve existir)
  let dailyRecord = await getDailyRecord(userId, expenseDate);
  
  if (!dailyRecord) {
    // Criar registro se não existir (primeiro gasto do dia)
    await getTodayBudget(userId); // Isso cria o registro
    dailyRecord = await getDailyRecord(userId, expenseDate);
  }
  
  // 2. Criar o gasto
  const expense = await createExpense({
    user_id: userId,
    daily_record_id: dailyRecord.id,
    amount: request.amount,
    category: request.category,
    description: request.description,
    expense_date: expenseDate,
    expense_time: request.time
  });
  
  // 3. Atualizar registro diário
  const newTotalSpent = dailyRecord.total_spent + request.amount;
  const newDailyBalance = dailyRecord.available_budget - newTotalSpent;
  
  dailyRecord = await updateDailyRecord(dailyRecord.id, {
    total_spent: newTotalSpent,
    daily_balance: newDailyBalance
  });
  
  // 4. Atualizar saldo acumulado do ciclo
  const cycle = await getCycleById(dailyRecord.cycle_id);
  const newAccumulatedBalance = await recalculateCycleBalance(cycle.id);
  
  await updateCycle(cycle.id, {
    accumulated_balance: newAccumulatedBalance
  });
  
  // 5. Retornar resposta
  const remaining = dailyRecord.available_budget - newTotalSpent;
  
  return {
    expense,
    updated_daily: dailyRecord,
    new_available_budget: remaining,
    message: remaining >= 0 
      ? `Gasto registrado. Ainda disponível hoje: R$ ${remaining.toFixed(2)}`
      : `Gasto registrado. Você excedeu o orçamento de hoje em R$ ${Math.abs(remaining).toFixed(2)}`
  };
}
```

### 8.3 Fluxo: Virada de Semana

```typescript
async function handleWeekTransition(
  userId: string,
  config: BudgetConfig
): Promise<WeekCycle> {
  const today = new Date();
  
  // 1. Buscar ciclo que deveria estar ativo
  const currentCycle = await getActiveCycle(userId, today);
  
  // 2. Se o ciclo atual é de uma semana passada, fechar
  if (currentCycle && new Date(currentCycle.end_date) < today) {
    await updateCycle(currentCycle.id, { status: 'closed' });
    
    // 3. Calcular saldo a carregar baseado no modo
    let carriedBalance = 0;
    
    switch (config.carry_over_mode) {
      case 'carry_all':
        carriedBalance = currentCycle.accumulated_balance;
        break;
      case 'carry_deficit':
        carriedBalance = Math.min(0, currentCycle.accumulated_balance);
        break;
      case 'carry_credit':
        carriedBalance = Math.max(0, currentCycle.accumulated_balance);
        break;
      case 'reset':
      default:
        carriedBalance = 0;
    }
    
    // 4. Criar novo ciclo
    const { start, end } = calculateWeekCycleDates(today, config.week_start_day);
    
    return await createCycle({
      user_id: userId,
      config_id: config.id,
      start_date: start,
      end_date: end,
      initial_budget: config.daily_base * 7,
      carried_balance: carriedBalance,
      accumulated_balance: carriedBalance, // Começa com o saldo carregado
      status: 'active'
    });
  }
  
  // Se não há ciclo ou ciclo está ok, apenas retornar/criar
  if (!currentCycle) {
    const { start, end } = calculateWeekCycleDates(today, config.week_start_day);
    
    return await createCycle({
      user_id: userId,
      config_id: config.id,
      start_date: start,
      end_date: end,
      initial_budget: config.daily_base * 7,
      carried_balance: 0,
      accumulated_balance: 0,
      status: 'active'
    });
  }
  
  return currentCycle;
}
```

### 8.4 Fluxo: Recalcular Saldo do Ciclo

```typescript
async function recalculateCycleBalance(cycleId: string): Promise<number> {
  // Buscar todos os registros diários do ciclo
  const dailyRecords = await getDailyRecordsByCycle(cycleId);
  
  // Somar todos os saldos diários
  const accumulatedBalance = dailyRecords.reduce((sum, record) => {
    return sum + record.daily_balance;
  }, 0);
  
  return Math.round(accumulatedBalance * 100) / 100;
}
```

---

## 9. Edge Cases e Tratamentos

### 9.1 Casos Especiais

| Caso | Tratamento |
|------|------------|
| **Primeiro dia do ciclo** | accumulated_balance = 0, usar base pura |
| **Último dia com déficit grande** | Mostrar alerta, permitir gasto, déficit vai para próxima semana (se configurado) |
| **Usuário sem gastos por dias** | Registros não criados, accumulated_balance permanece igual |
| **Gasto em data passada** | Recalcular todos os registros subsequentes |
| **Exclusão de gasto** | Recalcular registro do dia e accumulated_balance |
| **Alteração de base no meio do ciclo** | Usar nova base a partir de hoje, não retroativo |
| **Orçamento negativo** | Permitir, mas mostrar alerta visual forte |
| **29 de fevereiro** | Usar biblioteca de datas confiável |

### 9.2 Validações

```typescript
// Validar valor do gasto
function validateExpenseAmount(amount: number): void {
  if (amount <= 0) {
    throw new Error('Valor do gasto deve ser positivo');
  }
  if (amount > 1000000) {
    throw new Error('Valor do gasto muito alto');
  }
  if (!Number.isFinite(amount)) {
    throw new Error('Valor inválido');
  }
}

// Validar base diária
function validateDailyBase(dailyBase: number): void {
  if (dailyBase <= 0) {
    throw new Error('Base diária deve ser positiva');
  }
  if (dailyBase > 100000) {
    throw new Error('Base diária muito alta');
  }
}

// Validar data do gasto
function validateExpenseDate(date: Date, cycleStart: Date, cycleEnd: Date): void {
  if (date < cycleStart || date > cycleEnd) {
    throw new Error('Data fora do ciclo atual');
  }
}
```

---

## 10. API Endpoints Sugeridos

```typescript
// ============================================
// CONFIGURAÇÃO
// ============================================

// Criar/atualizar configuração
POST   /api/budget/config
Body: { daily_base: number, week_start_day?: number, carry_over_mode?: string }

// Obter configuração atual
GET    /api/budget/config

// ============================================
// ORÇAMENTO DIÁRIO
// ============================================

// Obter orçamento de hoje
GET    /api/budget/today

// Obter orçamento de uma data específica
GET    /api/budget/day/:date

// ============================================
// GASTOS
// ============================================

// Registrar gasto
POST   /api/budget/expenses
Body: { amount: number, category?: string, description?: string, date?: string }

// Listar gastos do dia
GET    /api/budget/expenses/today

// Listar gastos de uma data
GET    /api/budget/expenses/:date

// Atualizar gasto
PUT    /api/budget/expenses/:id
Body: { amount?: number, category?: string, description?: string }

// Excluir gasto
DELETE /api/budget/expenses/:id

// ============================================
// CICLOS E RELATÓRIOS
// ============================================

// Obter ciclo semanal atual
GET    /api/budget/cycle/current

// Obter resumo semanal
GET    /api/budget/summary/week

// Obter resumo mensal
GET    /api/budget/summary/month/:year/:month

// Histórico de ciclos
GET    /api/budget/cycles?limit=10&offset=0
```

---

## 11. Componentes de UI Sugeridos

### 11.1 Dashboard Principal

```
┌─────────────────────────────────────────────┐
│  Hoje você pode gastar:                     │
│                                             │
│     R$ 103,33                              │
│     ▲ R$ 3,33 acima da base                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ Gasto: R$ 45,00 / R$ 103,33         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Restam R$ 58,33 para hoje                 │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Esta semana:                               │
│  • Orçamento: R$ 700,00                    │
│  • Gasto até agora: R$ 245,00              │
│  • Saldo acumulado: +R$ 23,33              │
│  • Dias restantes: 4                        │
│                                             │
└─────────────────────────────────────────────┘
```

### 11.2 Indicadores Visuais

```typescript
// Cores por status
const statusColors = {
  above_base: '#22c55e',  // Verde - tem crédito
  at_base: '#3b82f6',     // Azul - equilibrado
  below_base: '#f59e0b',  // Amarelo - tem débito
  critical: '#ef4444'     // Vermelho - crítico
};

// Ícones
const statusIcons = {
  above_base: '↑',
  at_base: '→',
  below_base: '↓',
  critical: '⚠️'
};
```

### 11.3 Gráfico de Evolução Semanal

```
Orçamento Disponível por Dia

R$ 140 │                              ●
R$ 120 │                    ●
R$ 100 │──●─────●─────●─────────────────── Base
R$  80 │        │           │
R$  60 │        │     ●     │
       └────┬────┬────┬────┬────┬────┬────
          Seg  Ter  Qua  Qui  Sex  Sáb  Dom
```

---

## 12. Checklist de Implementação

### Fase 1: Core
- [ ] Criar tabelas no banco de dados
- [ ] Implementar funções de cálculo
- [ ] Criar endpoint GET /api/budget/today
- [ ] Criar endpoint POST /api/budget/config
- [ ] Criar endpoint POST /api/budget/expenses

### Fase 2: Ciclos
- [ ] Implementar criação automática de ciclos
- [ ] Implementar virada de semana
- [ ] Implementar modos de carry-over
- [ ] Criar endpoint GET /api/budget/cycle/current

### Fase 3: Histórico
- [ ] Implementar recálculo de saldo
- [ ] Criar endpoint GET /api/budget/summary/week
- [ ] Criar endpoint GET /api/budget/summary/month
- [ ] Implementar edição/exclusão de gastos

### Fase 4: UI
- [ ] Dashboard principal
- [ ] Formulário de gasto rápido
- [ ] Lista de gastos do dia
- [ ] Gráfico de evolução semanal

### Fase 5: Polish
- [ ] Notificações de orçamento baixo
- [ ] Categorias de gastos
- [ ] Exportação de dados
- [ ] Configurações avançadas

---

## 13. Prompt para Claude Code

Use este prompt ao iniciar a implementação:

```
Preciso implementar o "Sistema de Orçamento Fluido" conforme a especificação 
no arquivo orcamento-fluido-spec.md.

Stack do projeto: [INSERIR STACK - ex: Next.js 14, Supabase, TypeScript]

O conceito central é:
- Usuário define uma base diária (ex: R$ 100)
- Gastos abaixo da base geram crédito diluído nos dias restantes da semana
- Gastos acima da base geram débito diluído nos dias restantes

Fórmula principal:
orçamento_hoje = base_diária + (saldo_acumulado / dias_restantes)

Comece por:
1. Criar as tabelas no banco de dados
2. Implementar as funções de cálculo core
3. Criar o endpoint para obter o orçamento de hoje

Siga exatamente a estrutura de dados e tipos definidos na especificação.
```

---

## 14. Notas Finais

### Decisões de Produto Pendentes

1. **Início da semana**: Segunda (padrão) ou configurável?
2. **Modo de carry-over padrão**: Reset ou arrastar déficit?
3. **Limite mínimo**: Orçamento pode ficar negativo infinitamente?
4. **Visão mensal**: Apenas informativa ou com diluição própria?
5. **Múltiplos orçamentos**: Usuário pode ter orçamentos paralelos?

### Melhorias Futuras

- Metas de economia
- Categorização automática de gastos
- Previsão de fim de semana/mês
- Integração com bancos (Open Banking)
- Compartilhamento familiar
- Orçamentos por categoria

---

*Documento criado para uso com Claude Code. Mantenha atualizado conforme decisões de produto forem tomadas.*
