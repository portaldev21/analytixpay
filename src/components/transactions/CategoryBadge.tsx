import { Badge } from "@/components/ui/badge"

const categoryColors: Record<string, string> = {
  "Alimentação": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Transporte": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Saúde": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "Lazer": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Compras": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "Educação": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Casa": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Vestuário": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Beleza": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Tecnologia": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  "Serviços": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Outros": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

interface CategoryBadgeProps {
  category: string
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const colorClass = categoryColors[category] || categoryColors["Outros"]

  return (
    <Badge variant="outline" className={colorClass}>
      {category}
    </Badge>
  )
}
