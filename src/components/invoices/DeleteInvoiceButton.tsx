"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteInvoice } from "@/actions/invoice.actions";
import { toast } from "sonner";

interface DeleteInvoiceButtonProps {
  invoiceId: string;
  accountId: string;
  invoiceName: string;
  transactionCount?: number;
  onDeleteStart?: () => void;
}

export function DeleteInvoiceButton({
  invoiceId,
  accountId,
  invoiceName,
  transactionCount = 0,
  onDeleteStart,
}: DeleteInvoiceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    onDeleteStart?.();

    try {
      const result = await deleteInvoice(invoiceId, accountId);

      if (result.success && result.data) {
        toast.success(
          `Fatura deletada! ${result.data.deletedTransactions} ${result.data.deletedTransactions === 1 ? "transação removida" : "transações removidas"}.`
        );
        setIsOpen(false);
      } else {
        toast.error(result.error || "Erro ao deletar fatura");
        setIsDeleting(false);
      }
    } catch (error) {
      toast.error("Erro ao deletar fatura");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all hover:scale-110"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Deletar Fatura
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p className="text-base">
                Você tem certeza que deseja deletar a fatura{" "}
                <span className="font-semibold text-foreground">
                  {invoiceName}
                </span>
                ?
              </p>
              {transactionCount > 0 && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-destructive font-medium text-sm">
                    ⚠️ Esta ação irá remover permanentemente{" "}
                    <span className="font-bold">{transactionCount}</span>{" "}
                    {transactionCount === 1 ? "transação" : "transações"}{" "}
                    associadas a esta fatura.
                  </p>
                </div>
              )}
              <p className="text-muted-foreground text-sm">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isDeleting}
            className="mt-0 hover:border-muted-foreground transition-colors"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-white border-2 border-destructive hover:border-red-400 hover:shadow-lg hover:shadow-destructive/50 transition-all duration-200"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Fatura
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
