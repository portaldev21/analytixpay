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
