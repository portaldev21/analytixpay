// Database Types for AnalytiXPay
// Auto-generated types based on Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// =====================================================
// DATABASE TYPES
// =====================================================

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: TAccount;
        Insert: TAccountInsert;
        Update: TAccountUpdate;
      };
      account_members: {
        Row: TAccountMember;
        Insert: TAccountMemberInsert;
        Update: TAccountMemberUpdate;
      };
      invoices: {
        Row: TInvoice;
        Insert: TInvoiceInsert;
        Update: TInvoiceUpdate;
      };
      transactions: {
        Row: TTransaction;
        Insert: TTransactionInsert;
        Update: TTransactionUpdate;
      };
      categories: {
        Row: TCategory;
        Insert: TCategoryInsert;
        Update: TCategoryUpdate;
      };
      profiles: {
        Row: TProfile;
        Insert: TProfileInsert;
        Update: TProfileUpdate;
      };
      chat_conversations: {
        Row: TChatConversation;
        Insert: TChatConversationInsert;
        Update: TChatConversationUpdate;
      };
      chat_messages: {
        Row: TChatMessage;
        Insert: TChatMessageInsert;
        Update: TChatMessageUpdate;
      };
      budget_configs: {
        Row: TBudgetConfig;
        Insert: TBudgetConfigInsert;
        Update: TBudgetConfigUpdate;
      };
      week_cycles: {
        Row: TWeekCycle;
        Insert: TWeekCycleInsert;
        Update: TWeekCycleUpdate;
      };
      daily_records: {
        Row: TDailyRecord;
        Insert: TDailyRecordInsert;
        Update: TDailyRecordUpdate;
      };
      budget_expenses: {
        Row: TBudgetExpense;
        Insert: TBudgetExpenseInsert;
        Update: TBudgetExpenseUpdate;
      };
    };
  };
}

// =====================================================
// ACCOUNTS
// =====================================================

export type TAccount = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type TAccountInsert = {
  id?: string;
  name: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
};

export type TAccountUpdate = Partial<TAccountInsert>;

// =====================================================
// ACCOUNT MEMBERS
// =====================================================

export type TAccountMemberRole = "owner" | "member";

export type TAccountMember = {
  id: string;
  account_id: string;
  user_id: string;
  role: TAccountMemberRole;
  created_at: string;
};

export type TAccountMemberInsert = {
  id?: string;
  account_id: string;
  user_id: string;
  role?: TAccountMemberRole;
  created_at?: string;
};

export type TAccountMemberUpdate = Partial<TAccountMemberInsert>;

// =====================================================
// INVOICES
// =====================================================

export type TInvoiceStatus = "processing" | "completed" | "error";

export type TInvoice = {
  id: string;
  account_id: string;
  user_id: string | null;
  file_url: string;
  file_name: string;
  period: string | null;
  card_last_digits: string | null;
  total_amount: number | null;
  billing_date: string | null; // Data de vencimento da fatura
  status: TInvoiceStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type TInvoiceInsert = {
  id?: string;
  account_id: string;
  user_id?: string | null;
  file_url: string;
  file_name: string;
  period?: string | null;
  card_last_digits?: string | null;
  total_amount?: number | null;
  billing_date?: string | null;
  status?: TInvoiceStatus;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TInvoiceUpdate = Partial<TInvoiceInsert>;

// =====================================================
// TRANSACTIONS
// =====================================================

export type TTransaction = {
  id: string;
  invoice_id: string;
  account_id: string;
  date: string; // Data da compra
  billing_date: string | null; // Data de vencimento da fatura
  description: string;
  category: string;
  amount: number;
  installment: string | null;
  is_international: boolean;
  created_at: string;
  updated_at: string;
};

export type TTransactionInsert = {
  id?: string;
  invoice_id: string;
  account_id: string;
  date: string;
  billing_date?: string | null;
  description: string;
  category?: string;
  amount: number;
  installment?: string | null;
  is_international?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TTransactionUpdate = Partial<TTransactionInsert>;

// =====================================================
// CATEGORIES
// =====================================================

export type TCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  keywords: string[] | null;
  created_at: string;
};

export type TCategoryInsert = {
  id?: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  keywords?: string[] | null;
  created_at?: string;
};

export type TCategoryUpdate = Partial<TCategoryInsert>;

// =====================================================
// PROFILES
// =====================================================

export type TProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TProfileInsert = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TProfileUpdate = Partial<TProfileInsert>;

// =====================================================
// PLANNING TYPES
// =====================================================

export type TFinancialPlan = {
  id: string;
  account_id: string;
  name: string;
  start_month: string;
  months: number;
  initial_balance: number;
  created_at: string;
  updated_at: string;
};

export type TPlanIncomeSource = {
  id: string;
  plan_id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "once";
  month_index: number | null;
  created_at: string;
};

export type TPlanScenario = {
  id: string;
  plan_id: string;
  type: "current" | "optimistic" | "pessimistic";
  name: string;
  created_at: string;
};

export type TPlanScenarioItem = {
  id: string;
  scenario_id: string;
  category: string;
  expense_type: "fixed" | "variable";
  name: string;
  amount: number;
  end_month: number | null;
  auto_detected: boolean;
  created_at: string;
};

export type TPlanScenarioWithItems = TPlanScenario & {
  items: TPlanScenarioItem[];
};

export type TFinancialPlanWithDetails = TFinancialPlan & {
  incomes: TPlanIncomeSource[];
  scenarios: TPlanScenarioWithItems[];
};

export type TPlanSummary = {
  id: string;
  name: string;
  start_month: string;
  months: number;
  initial_balance: number;
  monthly_result: number;
  final_balance: number;
  created_at: string;
};

// =====================================================
// EXTENDED TYPES (WITH JOINS)
// =====================================================

export type TAccountWithMembers = TAccount & {
  members: (TAccountMember & {
    profile: TProfile;
  })[];
  _count: {
    members: number;
    invoices: number;
  };
};

export type TInvoiceWithTransactions = TInvoice & {
  transactions: TTransaction[];
  _count: {
    transactions: number;
  };
};

export type TTransactionWithInvoice = TTransaction & {
  invoice: TInvoice;
};

export type TAccountMemberWithProfile = TAccountMember & {
  profile: TProfile;
};

// =====================================================
// API RESPONSE TYPES
// =====================================================

export type TApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type TApiPaginatedResponse<T> = TApiResponse<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// =====================================================
// DASHBOARD TYPES
// =====================================================

export type TDashboardStats = {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  largestTransaction: {
    amount: number;
    description: string;
    date: string;
  } | null;
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  monthlyComparison: {
    currentMonth: number;
    lastMonth: number;
    percentageChange: number;
  };
};

export type TMonthlySpending = {
  month: string;
  total: number;
  count: number;
  categories: {
    [key: string]: number;
  };
};

// =====================================================
// FILTER TYPES
// =====================================================

export type TTransactionFilters = {
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  invoiceId?: string;
  accountId?: string;
  installmentType?: "all" | "current" | "past" | "none";
};

export type TInvoiceFilters = {
  period?: string;
  status?: TInvoiceStatus;
  accountId?: string;
  userId?: string;
};

// =====================================================
// FORM TYPES
// =====================================================

export type TCreateAccountForm = {
  name: string;
};

export type TAddMemberForm = {
  email: string;
  role: TAccountMemberRole;
};

export type TUploadInvoiceForm = {
  file: File;
  accountId: string;
  billingDate: string; // Data de vencimento (obrigatório)
  period?: string;
  cardLastDigits?: string;
};

export type TEditTransactionForm = {
  date: string;
  description: string;
  category: string;
  amount: number;
  installment?: string;
  is_international: boolean;
};

// =====================================================
// PDF PARSING TYPES
// =====================================================

export type TParsedTransaction = {
  date: string;
  billing_date?: string; // Data de vencimento (propagada da fatura)
  description: string;
  amount: number;
  category?: string;
  installment?: string;
  is_international?: boolean;
};

export type TPdfParseResult = {
  transactions: TParsedTransaction[];
  period?: string;
  cardLastDigits?: string;
  totalAmount?: number;
  dueDate?: string; // Data de vencimento extraída do PDF (YYYY-MM-DD)
  error?: string;
};

// =====================================================
// UTILITY TYPES
// =====================================================

export type TDateRange = {
  start: string;
  end: string;
};

export type TSortOrder = "asc" | "desc";

export type TSortField<T> = keyof T;

export type TPagination = {
  page: number;
  limit: number;
  offset: number;
};

// =====================================================
// CHAT TYPES (AI Financial Agent)
// =====================================================

export type TChatMessageRole = "user" | "assistant";

export type TChatConversation = {
  id: string;
  account_id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type TChatConversationInsert = {
  id?: string;
  account_id: string;
  user_id?: string | null;
  title?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TChatConversationUpdate = Partial<TChatConversationInsert>;

export type TChatMessage = {
  id: string;
  conversation_id: string;
  role: TChatMessageRole;
  content: string;
  metadata: Json | null;
  created_at: string;
};

export type TChatMessageInsert = {
  id?: string;
  conversation_id: string;
  role: TChatMessageRole;
  content: string;
  metadata?: Json | null;
  created_at?: string;
};

export type TChatMessageUpdate = Partial<TChatMessageInsert>;

export type TChatConversationWithMessages = TChatConversation & {
  messages: TChatMessage[];
};

// =====================================================
// ANALYTICS TYPES
// =====================================================

export type TDailySpending = {
  date: string;
  total: number;
  count: number;
};

export type TSpendingByCard = {
  card_last_digits: string;
  total: number;
  count: number;
};

export type TInstallmentProjection = {
  description: string;
  current_installment: number;
  total_installments: number;
  amount: number;
  next_date: string;
  remaining_amount: number;
  remaining_installments: number;
};

export type TFinancialContext = {
  period: {
    startDate: string;
    endDate: string;
  };
  stats: {
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    dailyAverage: number;
  };
  categoryBreakdown: {
    category: string;
    total: number;
    percentage: number;
  }[];
  comparison: {
    previousPeriodTotal: number;
    percentageChange: number;
  };
  topExpenses: {
    description: string;
    amount: number;
    date: string;
    category: string;
  }[];
  recurring: {
    description: string;
    amount: number;
    frequency: string;
  }[];
  healthScore: {
    score: number;
    grade: string;
    recommendations: string[];
  };
};

// =====================================================
// BUDGET TYPES (Rolling Budget / Orcamento Fluido)
// =====================================================

export type TCarryOverMode =
  | "reset"
  | "carry_all"
  | "carry_deficit"
  | "carry_credit";
export type TCycleStatus = "active" | "closed";
export type TReconciliationStatus =
  | "pending"
  | "matched"
  | "unmatched"
  | "manual";
export type TBudgetStatus =
  | "above_base"
  | "at_base"
  | "below_base"
  | "critical";

// Budget Configuration
export type TBudgetConfig = {
  id: string;
  account_id: string;
  daily_base: number;
  week_start_day: number;
  carry_over_mode: TCarryOverMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TBudgetConfigInsert = {
  id?: string;
  account_id: string;
  daily_base: number;
  week_start_day?: number;
  carry_over_mode?: TCarryOverMode;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TBudgetConfigUpdate = Partial<TBudgetConfigInsert>;

// Week Cycles
export type TWeekCycle = {
  id: string;
  account_id: string;
  config_id: string | null;
  start_date: string;
  end_date: string;
  initial_budget: number;
  carried_balance: number;
  accumulated_balance: number;
  status: TCycleStatus;
  created_at: string;
  updated_at: string;
};

export type TWeekCycleInsert = {
  id?: string;
  account_id: string;
  config_id?: string | null;
  start_date: string;
  end_date: string;
  initial_budget: number;
  carried_balance?: number;
  accumulated_balance?: number;
  status?: TCycleStatus;
  created_at?: string;
  updated_at?: string;
};

export type TWeekCycleUpdate = Partial<TWeekCycleInsert>;

// Daily Records
export type TDailyRecord = {
  id: string;
  account_id: string;
  cycle_id: string;
  record_date: string;
  base_budget: number;
  available_budget: number;
  total_spent: number;
  daily_balance: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
};

export type TDailyRecordInsert = {
  id?: string;
  account_id: string;
  cycle_id: string;
  record_date: string;
  base_budget: number;
  available_budget: number;
  total_spent?: number;
  daily_balance?: number;
  remaining_days: number;
  created_at?: string;
  updated_at?: string;
};

export type TDailyRecordUpdate = Partial<TDailyRecordInsert>;

// Budget Expenses (Manual entries)
export type TBudgetExpense = {
  id: string;
  account_id: string;
  daily_record_id: string;
  user_id: string | null;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
  expense_time: string | null;
  reconciled_transaction_id: string | null;
  reconciliation_status: TReconciliationStatus;
  created_at: string;
  updated_at: string;
};

export type TBudgetExpenseInsert = {
  id?: string;
  account_id: string;
  daily_record_id: string;
  user_id?: string | null;
  amount: number;
  category?: string;
  description?: string | null;
  expense_date: string;
  expense_time?: string | null;
  reconciled_transaction_id?: string | null;
  reconciliation_status?: TReconciliationStatus;
  created_at?: string;
  updated_at?: string;
};

export type TBudgetExpenseUpdate = Partial<TBudgetExpenseInsert>;

// =====================================================
// BUDGET RESPONSE DTOs
// =====================================================

export type TTodayBudgetResponse = {
  date: string;
  available_budget: number;
  base_budget: number;
  adjustment: number;
  total_spent_today: number;
  remaining_today: number;
  actual_from_invoices: number;
  manual_expenses: number;
  cycle_info: {
    id: string;
    days_remaining: number;
    accumulated_balance: number;
    week_start: string;
    week_end: string;
  };
  status: TBudgetStatus;
};

export type TWeekSummary = {
  cycle: TWeekCycle;
  daily_records: TDailyRecord[];
  total_budget: number;
  total_spent: number;
  total_saved: number;
  average_daily_spent: number;
  days_over_budget: number;
  days_under_budget: number;
  comparison_with_actual: {
    manual_total: number;
    invoice_total: number;
    difference: number;
  };
};

export type TBudgetVsActual = {
  budget_spent: number;
  actual_from_invoices: number;
  difference: number;
  by_category: {
    category: string;
    budget: number;
    actual: number;
    diff: number;
  }[];
};

export type TReconciliationSuggestion = {
  expense: TBudgetExpense;
  suggestions: {
    transaction: TTransaction;
    confidence: number;
    reasons: string[];
  }[];
};

// Extended types with relations
export type TWeekCycleWithRecords = TWeekCycle & {
  daily_records: TDailyRecord[];
  config: TBudgetConfig | null;
};

export type TDailyRecordWithExpenses = TDailyRecord & {
  expenses: TBudgetExpense[];
};

// =====================================================
// BUDGET FORECAST TYPES
// =====================================================

export type TMonthlyProjection = {
  month: string; // "2025-01", "2025-02", etc.
  total_installments: number; // soma das parcelas do mes
  installment_count: number; // quantidade de parcelas
  details: {
    description: string;
    amount: number;
    installment: string; // "3/12"
  }[];
};

export type TBudgetImpact = {
  // Media mensal de parcelas comprometidas
  avg_monthly_installments: number;

  // Quanto sobra apos parcelas
  daily_available: number; // daily_base - (avg_monthly / 30)
  weekly_available: number; // daily_available * 7
  monthly_available: number; // daily_base * 30 - avg_monthly

  // Percentual comprometido
  commitment_percentage: number; // (avg_monthly / monthly_budget) * 100
};

export type TCalendarEvent = {
  date: string; // "2025-01-15"
  description: string;
  amount: number;
  installment: string;
};

export type TBudgetForecast = {
  // Config do budget
  budget_config: {
    daily_base: number;
    weekly_budget: number; // daily_base * 7
    monthly_budget: number; // daily_base * 30
  } | null;

  // Parcelas ativas agrupadas
  active_installments: TInstallmentProjection[];

  // Projecao por mes
  monthly_projections: TMonthlyProjection[];

  // Impacto no orcamento
  budget_impact: TBudgetImpact;

  // Eventos do calendario (proximo 6 meses)
  calendar_events: TCalendarEvent[];
};
