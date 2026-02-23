"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/actions/transaction.actions";
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
import type { TTransaction } from "@/db/types";

interface DeleteTransactionButtonProps {
  transaction: TTransaction;
  onDeleteStart?: () => void;
}

export function DeleteTransactionButton({
  transaction,
  onDeleteStart,
}: DeleteTransactionButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    onDeleteStart?.(); // Chama callback para iniciar animação

    try {
      const result = await deleteTransaction(transaction.id, transaction.account_id);

      if (result.success) {
        toast.success("Transação deletada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao deletar transação");
        setDeleting(false);
      }
    } catch (error) {
      toast.error("Erro ao deletar transação");
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Deletar transação</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Transação</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar a transação "
            {transaction.description}"? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleting ? "Deletando..." : "Deletar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
