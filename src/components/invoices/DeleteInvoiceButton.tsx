"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
}

export function DeleteInvoiceButton({
  invoiceId,
  accountId,
  invoiceName,
  transactionCount = 0,
}: DeleteInvoiceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteInvoice(invoiceId, accountId);

      if (result.success && result.data) {
        toast.success(
          `Fatura deletada com sucesso! ${result.data.deletedTransactions} transações foram removidas.`
        );
        setIsOpen(false);
      } else {
        toast.error(result.error || "Erro ao deletar fatura");
      }
    } catch (error) {
      toast.error("Erro ao deletar fatura");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Fatura</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você tem certeza que deseja deletar a fatura{" "}
              <span className="font-semibold text-foreground">
                {invoiceName}
              </span>
              ?
            </p>
            {transactionCount > 0 && (
              <p className="text-destructive font-medium">
                Esta ação irá remover permanentemente {transactionCount}{" "}
                {transactionCount === 1 ? "transação" : "transações"} associadas
                a esta fatura.
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deletando..." : "Deletar Fatura"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
