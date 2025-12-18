import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceWithTransactions } from "@/actions/invoice.actions";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { CardGlass } from "@/components/ui/card-glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ accountId?: string; installment?: string }>;
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: InvoiceDetailPageProps) {
  const { id } = await params;
  const { accountId: queryAccountId, installment } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get account ID from query or from user's first account
  let accountId = queryAccountId;
  if (!accountId) {
    const { data: accountMember } = await supabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", user.id)
      .single();

    accountId = (accountMember as any)?.account_id;
  }

  if (!accountId) {
    redirect("/settings");
  }

  const result = await getInvoiceWithTransactions(id, accountId);

  if (!result.success || !result.data) {
    notFound();
  }

  const invoice = result.data;

  // Filter transactions by installment type if specified
  let filteredTransactions = invoice.transactions;
  if (installment === "current") {
    filteredTransactions = invoice.transactions.filter(
      (t) => t.installment && t.installment.startsWith("1/"),
    );
  } else if (installment === "past") {
    filteredTransactions = invoice.transactions.filter(
      (t) => t.installment && !t.installment.startsWith("1/"),
    );
  } else if (installment === "none") {
    filteredTransactions = invoice.transactions.filter((t) => !t.installment);
  }

  // Calculate statistics
  const totalAmount = invoice.transactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const transactionCount = invoice.transactions.length;

  // Category breakdown
  const categoryBreakdown = invoice.transactions.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / totalAmount) * 100).toFixed(1),
    }));

  // Count installments
  const installmentStats = {
    current: invoice.transactions.filter(
      (t) => t.installment && t.installment.startsWith("1/"),
    ).length,
    past: invoice.transactions.filter(
      (t) => t.installment && !t.installment.startsWith("1/"),
    ).length,
    none: invoice.transactions.filter((t) => !t.installment).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Detalhes da Fatura
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            {invoice.file_name}
          </p>
        </div>
      </div>

      {/* Invoice Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardGlass variant="dark-1" size="lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              Vencimento
            </span>
            <div className="p-2 rounded-lg bg-[var(--color-card-dark-2)]">
              <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
            {invoice.billing_date
              ? formatDate(invoice.billing_date)
              : "Não informado"}
          </div>
          {invoice.period && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Período: {invoice.period}
            </p>
          )}
        </CardGlass>

        <CardGlass variant="dark-1" size="lg" hoverGlow="green">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              Total
            </span>
            <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20">
              <TrendingUp className="h-4 w-4 text-[var(--color-primary-start)]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(totalAmount)}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {transactionCount} transações
          </p>
        </CardGlass>

        <CardGlass variant="dark-1" size="lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              Cartão
            </span>
            <div className="p-2 rounded-lg bg-[var(--color-card-dark-2)]">
              <CreditCard className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
            {invoice.card_last_digits
              ? `**** ${invoice.card_last_digits}`
              : "Não identificado"}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Últimos 4 dígitos
          </p>
        </CardGlass>

        <CardGlass variant="dark-1" size="lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              Status
            </span>
            <div className="p-2 rounded-lg bg-[var(--color-card-dark-2)]">
              <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
          <Badge
            variant={
              invoice.status === "completed"
                ? "positive"
                : invoice.status === "error"
                  ? "destructive"
                  : "purple"
            }
            className="text-base py-1.5 px-4"
          >
            {invoice.status === "completed"
              ? "Processado"
              : invoice.status === "error"
                ? "Erro"
                : "Processando"}
          </Badge>
        </CardGlass>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CardGlass variant="dark-1" size="lg">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Gastos por Categoria
          </h3>
          <div className="space-y-4">
            {sortedCategories.map(({ category, amount, percentage }) => {
              const color = getCategoryColor(category);
              return (
                <div key={category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {category}
                      </span>
                      <span className="text-sm text-[var(--color-text-muted)]">
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--color-card-dark-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] w-24 text-right tabular-nums">
                    {formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardGlass>

        <CardGlass variant="dark-1" size="lg">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Parcelas
          </h3>
          <div className="space-y-3">
            <Link
              href={`/invoices/${id}?accountId=${accountId}&installment=current`}
              className={`block p-4 rounded-xl border transition-all ${
                installment === "current"
                  ? "bg-[var(--color-primary-start)]/10 border-[var(--color-primary-start)]/50"
                  : "border-[var(--glass-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-card-dark-2)]"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    Parcelas Novas (1/X)
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Primeira parcela de compras parceladas
                  </p>
                </div>
                <Badge variant="positive">{installmentStats.current}</Badge>
              </div>
            </Link>

            <Link
              href={`/invoices/${id}?accountId=${accountId}&installment=past`}
              className={`block p-4 rounded-xl border transition-all ${
                installment === "past"
                  ? "bg-[var(--color-primary-start)]/10 border-[var(--color-primary-start)]/50"
                  : "border-[var(--glass-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-card-dark-2)]"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    Parcelas Anteriores (2+/X)
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Parcelas de compras feitas em faturas anteriores
                  </p>
                </div>
                <Badge variant="purple">{installmentStats.past}</Badge>
              </div>
            </Link>

            <Link
              href={`/invoices/${id}?accountId=${accountId}&installment=none`}
              className={`block p-4 rounded-xl border transition-all ${
                installment === "none"
                  ? "bg-[var(--color-primary-start)]/10 border-[var(--color-primary-start)]/50"
                  : "border-[var(--glass-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-card-dark-2)]"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    Compras à Vista
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Transações sem parcelamento
                  </p>
                </div>
                <Badge variant="secondary">{installmentStats.none}</Badge>
              </div>
            </Link>

            {installment && (
              <Link
                href={`/invoices/${id}?accountId=${accountId}`}
                className="block text-center text-sm text-[var(--color-primary-start)] hover:text-[var(--color-positive)] transition-colors"
              >
                Limpar filtro
              </Link>
            )}
          </div>
        </CardGlass>
      </div>

      {/* Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Transações
            {installment && (
              <span className="text-[var(--color-text-muted)] font-normal ml-2">
                ({filteredTransactions.length} de {transactionCount})
              </span>
            )}
          </h2>
        </div>
        <Suspense fallback={<Loading className="py-12" />}>
          <TransactionsTable transactions={filteredTransactions} />
        </Suspense>
      </div>
    </div>
  );
}
