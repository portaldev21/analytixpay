import { Badge } from "@/components/ui/badge"
import type { TTransactionCategory } from "@/db/types"

const categoryColors: Record<TTransactionCategory, string> = {
  food: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  transport: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  health: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  shopping: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  education: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  bills: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  travel: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  services: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  subscriptions: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  investment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

const categoryLabels: Record<TTransactionCategory, string> = {
  food: "Alimentação",
  transport: "Transporte",
  health: "Saúde",
  entertainment: "Lazer",
  shopping: "Compras",
  education: "Educação",
  bills: "Contas",
  travel: "Viagens",
  services: "Serviços",
  subscriptions: "Assinaturas",
  investment: "Investimentos",
  other: "Outros",
}

interface CategoryBadgeProps {
  category: TTransactionCategory
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge variant="outline" className={categoryColors[category]}>
      {categoryLabels[category]}
    </Badge>
  )
}
