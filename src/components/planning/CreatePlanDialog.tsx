"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createPlan } from "@/actions/planning.actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createPlanSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no minimo 3 caracteres")
    .max(100, "Nome deve ter no maximo 100 caracteres"),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Selecione um mes valido"),
  initialBalance: z
    .number({ message: "Informe um valor valido" })
    .min(0, "Saldo inicial nao pode ser negativo"),
});

type CreatePlanFormData = z.infer<typeof createPlanSchema>;

interface CreatePlanDialogProps {
  accountId: string;
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getDefaultPlanName(): string {
  return `Planejamento ${new Date().getFullYear()}`;
}

export function CreatePlanDialog({ accountId }: CreatePlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreatePlanFormData>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: getDefaultPlanName(),
      startMonth: getCurrentMonth(),
      initialBalance: 0,
    },
  });

  const onSubmit = async (data: CreatePlanFormData) => {
    const result = await createPlan(
      accountId,
      data.name,
      data.startMonth,
      data.initialBalance,
    );

    if (result.success && result.data) {
      toast.success("Planejamento criado com sucesso!");
      setOpen(false);
      reset();
      router.push(`/planning/${result.data.id}`);
    } else {
      toast.error(result.error || "Erro ao criar planejamento");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset({
        name: getDefaultPlanName(),
        startMonth: getCurrentMonth(),
        initialBalance: 0,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          Novo Planejamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Novo Planejamento Financeiro</DialogTitle>
          <DialogDescription>
            Crie um plano para projetar sua saude financeira nos proximos meses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Nome</Label>
              <Input
                id="plan-name"
                placeholder="Ex: Planejamento 2026"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-[var(--color-negative)]">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Start month field */}
            <div className="grid gap-2">
              <Label htmlFor="plan-start-month">Mes de inicio</Label>
              <Input
                id="plan-start-month"
                type="month"
                {...register("startMonth")}
                disabled={isSubmitting}
              />
              {errors.startMonth && (
                <p className="text-sm text-[var(--color-negative)]">
                  {errors.startMonth.message}
                </p>
              )}
            </div>

            {/* Initial balance field */}
            <div className="grid gap-2">
              <Label htmlFor="plan-initial-balance">Saldo inicial (R$)</Label>
              <Input
                id="plan-initial-balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("initialBalance", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.initialBalance && (
                <p className="text-sm text-[var(--color-negative)]">
                  {errors.initialBalance.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Planejamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
