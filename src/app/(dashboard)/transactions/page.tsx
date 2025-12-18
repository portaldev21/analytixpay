import { Suspense } from "react";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/actions/transaction.actions";
import { getInvoices } from "@/actions/invoice.actions";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loading } from "@/components/shared/Loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { TTransactionFilters, TTransaction } from "@/db/types";

interface SearchParams {
  invoiceId?: string;
  installment?: string;
  category?: string;
}

// Filter transactions by installment type (done in-memory since Supabase doesn't support regex easily)
function filterByInstallment(
  transactions: TTransaction[],
  installmentType?: string,
): TTransaction[] {
  if (!installmentType || installmentType === "all") return transactions;

  switch (installmentType) {
    case "current":
      return transactions.filter(
        (t) => t.installment && t.installment.startsWith("1/"),
      );
    case "past":
      return transactions.filter(
        (t) => t.installment && !t.installment.startsWith("1/"),
      );
    case "none":
      return transactions.filter((t) => !t.installment);
    default:
      return transactions;
  }
}

async function TransactionsContent({
  accountId,
  searchParams,
}: {
  accountId: string;
  searchParams: SearchParams;
}) {
  // Build filters
  const filters: TTransactionFilters = {};
  if (searchParams.invoiceId) filters.invoiceId = searchParams.invoiceId;
  if (searchParams.category) filters.category = searchParams.category;

  // Fetch data in parallel
  const [transactionsResult, invoicesResult] = await Promise.all([
    getTransactions(accountId, filters),
    getInvoices(accountId),
  ]);

  if (!transactionsResult.success || !transactionsResult.data) {
    return (
      <div className="text-center text-destructive p-8">
        Erro ao carregar transações
      </div>
    );
  }

  // Filter by installment type (in-memory)
  const filteredTransactions = filterByInstallment(
    transactionsResult.data,
    searchParams.installment,
  );

  // Get unique categories for filter
  const categories = [
    ...new Set(transactionsResult.data.map((t) => t.category)),
  ].sort();

  // Calculate summary stats
  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const transactionCount = filteredTransactions.length;
  const averageAmount =
    transactionCount > 0 ? totalAmount / transactionCount : 0;

  // Count by installment type
  const installmentCounts = {
    current: filteredTransactions.filter(
      (t) => t.installment && t.installment.startsWith("1/"),
    ).length,
    past: filteredTransactions.filter(
      (t) => t.installment && !t.installment.startsWith("1/"),
    ).length,
    none: filteredTransactions.filter((t) => !t.installment).length,
  };

  const invoices =
    invoicesResult.data?.map((i) => ({
      id: i.id,
      period: i.period,
      billing_date: i.billing_date,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TransactionFilters invoices={invoices} categories={categories} />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactionCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(averageAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm">
              <span className="text-green-600">
                {installmentCounts.current} novas
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-orange-600">
                {installmentCounts.past} anteriores
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma transação encontrada"
          description={
            searchParams.invoiceId ||
            searchParams.installment ||
            searchParams.category
              ? "Tente ajustar os filtros"
              : "Faça upload de uma fatura para ver suas transações aqui"
          }
        />
      ) : (
        <TransactionsTable transactions={filteredTransactions} />
      )}
    </div>
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: accountMember } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  const accountId = (accountMember as any)?.account_id;

  if (!accountId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">
            Visualizar todas as transações extraídas
          </p>
        </div>

        <div className="text-center p-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Você precisa criar uma conta primeiro. Vá em Configurações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
        <p className="text-muted-foreground mt-1">
          Visualizar e filtrar todas as transações extraídas das faturas
        </p>
      </div>

      <Suspense fallback={<Loading className="py-12" />}>
        <TransactionsContent accountId={accountId} searchParams={params} />
      </Suspense>
    </div>
  );
}
