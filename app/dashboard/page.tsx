import {
  getDashboardStats,
  getTopServices,
  getMonthlyAppointmentCounts,
  getProfessionalPerformance,
  getActivePromotions,
} from "@/lib/actions/dashboard"
import { getAppointments } from "@/lib/actions/appointments"
import { getProfessionals } from "@/lib/actions/professionals"
import { DashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [
    stats,
    topServices,
    appointments,
    professionals,
    appointmentCounts,
    professionalPerformance,
    activePromotions,
  ] = await Promise.all([
    getDashboardStats(),
    getTopServices(),
    getAppointments(),
    getProfessionals(),
    getMonthlyAppointmentCounts(),
    getProfessionalPerformance(),
    getActivePromotions(),
  ])

  return (
    <DashboardClient
      stats={stats}
      topServices={topServices}
      appointments={appointments}
      professionals={professionals}
      appointmentCounts={appointmentCounts}
      professionalPerformance={professionalPerformance}
      activePromotions={activePromotions}
    />
  )
}
