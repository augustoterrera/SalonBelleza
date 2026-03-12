import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@/lib/types"

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendiente",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  CONFIRMED: {
    label: "Confirmada",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  COMPLETED: {
    label: "Completada",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  NO_SHOW: {
    label: "No asistio",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
}

const defaultConfig = {
  label: "Desconocido",
  className: "bg-gray-50 text-gray-600 border-gray-200",
}

interface StatusBadgeProps {
  status: AppointmentStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as AppointmentStatus] ?? defaultConfig

  return (
    <Badge
      variant="outline"
      className={cn("font-medium border", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
