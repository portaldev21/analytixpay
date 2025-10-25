"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateTransaction,
  deleteTransaction,
} from "@/actions/transaction.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryBadge } from "./CategoryBadge";
import type { TTransaction } from "@/db/types";

interface EditTransactionDialogProps {
  transaction: TTransaction;
}

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Compras",
  "Educação",
  "Casa",
  "Serviços",
  "Outros",
];

export function EditTransactionDialog({
  transaction,
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    date: transaction.date.split("T")[0], // Convert to YYYY-MM-DD
    description: transaction.description,
    amount: transaction.amount,
    category: transaction.category,
    installment: transaction.installment || "",
    is_international: transaction.is_international,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateTransaction(
        transaction.id,
        transaction.account_id,
        {
          date: formData.date,
          description: formData.description,
          amount: Number(formData.amount),
          category: formData.category,
          installment: formData.installment || null,
          is_international: formData.is_international,
        },
      );

      if (result.success) {
        toast.success("Transação atualizada com sucesso!");
        setOpen(false);
      } else {
        toast.error(result.error || "Erro ao atualizar transação");
      }
    } catch (error) {
      toast.error("Erro ao atualizar transação");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const result = await deleteTransaction(transaction.id);

      if (result.success) {
        toast.success("Transação deletada com sucesso!");
        setOpen(false);
      } else {
        toast.error(result.error || "Erro ao deletar transação");
      }
    } catch (error) {
      toast.error("Erro ao deletar transação");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar transação</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>
            Faça alterações na transação. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category" className="flex-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CategoryBadge category={formData.category} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="installment">Parcela (opcional)</Label>
              <Input
                id="installment"
                value={formData.installment}
                onChange={(e) =>
                  setFormData({ ...formData, installment: e.target.value })
                }
                placeholder="Ex: 1/12"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_international"
                checked={formData.is_international}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    is_international: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="is_international"
                className="text-sm font-normal cursor-pointer"
              >
                Transação Internacional
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loading || deleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar Transação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta transação? Esta ação não
                    pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    Cancelar
                  </AlertDialogCancel>
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
            <div className="flex gap-2 flex-1 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading || deleting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || deleting}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
