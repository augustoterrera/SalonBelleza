"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"

export interface DashboardStats {
  todayAppointments: number
  totalClients: number
  activeProfessionals: number
  dailyOccupancy: number
  todayRevenue: number
  monthlyRevenue: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const tenantId = await getTenantId()
  const todayStr = new Date().toISOString().split("T")[0]
  const todayStart = new Date(`${todayStr}T00:00:00Z`)
  const todayEnd = new Date(`${todayStr}T23:59:59.999Z`)
  
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  
  const [
    todayAppointments,
    totalClients,
    activeProfessionals,
    todayCompletedAppointments,
    monthlyCompletedAppointments
  ] = await Promise.all([
    prisma.appointment.count({
      where: { tenantId, startAt: { gte: todayStart, lte: todayEnd } }
    }),
    prisma.customer.count({
      where: { tenantId }
    }),
    prisma.professional.count({
      where: { tenantId, isActive: true }
    }),
    prisma.appointment.findMany({
      where: { tenantId, startAt: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
      select: { price: true }
    }),
    prisma.appointment.findMany({
      where: { tenantId, startAt: { gte: monthStart }, status: 'COMPLETED' },
      select: { price: true }
    })
  ])

  const todayRevenue = todayCompletedAppointments.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)
  const monthlyRevenue = monthlyCompletedAppointments.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)

  // Calculate daily occupancy (appointments / available slots)
  // Assuming 8 hours * 2 slots per hour * number of professionals
  const profCount = activeProfessionals || 1
  const totalSlots = 8 * 2 * profCount
  const occupancy = Math.round((todayAppointments / totalSlots) * 100)

  return {
    todayAppointments,
    totalClients,
    activeProfessionals,
    dailyOccupancy: Math.min(occupancy, 100),
    todayRevenue,
    monthlyRevenue,
  }
}

export interface TopService {
  serviceId: string
  serviceName: string
  categoryColor: string
  count: number
}

export async function getTopServices(limit = 5): Promise<TopService[]> {
  const tenantId = await getTenantId()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  // We use raw query here because Prisma grouping by relations is complex,
  // but we can query it through findMany and group manually since limit is small.
  const appointments = await prisma.appointment.findMany({
    where: { tenantId, startAt: { gte: monthStart } },
    include: {
      service: {
        include: { category: true }
      }
    }
  })

  const countsMap = new Map<string, TopService>()
  
  for (const apt of appointments) {
    if (!apt.service) continue
      
    const serviceId = apt.serviceId
    if (!countsMap.has(serviceId)) {
      countsMap.set(serviceId, {
        serviceId: serviceId,
        serviceName: apt.service.name,
        categoryColor: apt.service.category?.color || '#0F7A61',
        count: 0
      })
    }
    countsMap.get(serviceId)!.count++
  }

  return Array.from(countsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const tenantId = await getTenantId()
  
  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: {
      customer: true,
      service: true
    },
    orderBy: { updatedAt: 'desc' },
    take: limit
  })

  return appointments.map(apt => {
    let statusText = 'Cita actualizada: '
    switch (apt.status) {
      case 'PENDING': statusText = 'Nueva cita: '; break;
      case 'CONFIRMED': statusText = 'Cita confirmada: '; break;
      case 'COMPLETED': statusText = 'Cita completada: '; break;
      case 'CANCELLED': statusText = 'Cita cancelada: '; break;
    }

    const clientName = apt.customer?.name || 'Cliente'
    const serviceName = apt.service?.name || 'Servicio'

    return {
      id: apt.id,
      type: 'appointment',
      description: `${statusText}${clientName} - ${serviceName}`,
      timestamp: apt.updatedAt
    }
  })
}

export interface ProfessionalPerformance {
  professionalId: string
  professionalName: string
  color: string
  appointmentCount: number
  revenue: number
}

export async function getProfessionalPerformance(): Promise<ProfessionalPerformance[]> {
  const tenantId = await getTenantId()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startAt: { gte: monthStart },
      status: { in: ["COMPLETED", "CONFIRMED"] },
    },
    include: { professional: true },
  })

  const map = new Map<string, ProfessionalPerformance>()

  for (const apt of appointments) {
    const id = apt.professionalId
    if (!map.has(id)) {
      map.set(id, {
        professionalId: id,
        professionalName: apt.professional?.name ?? apt.professionalNameSnapshot,
        color: apt.professional?.color ?? "#0F7A61",
        appointmentCount: 0,
        revenue: 0,
      })
    }
    const entry = map.get(id)!
    entry.appointmentCount++
    if (apt.status === "COMPLETED") {
      entry.revenue += Number(apt.finalPrice ?? apt.price ?? 0)
    }
  }

  return Array.from(map.values()).sort((a, b) => b.appointmentCount - a.appointmentCount)
}

export interface ActivePromotion {
  id: string
  title: string
  description?: string
  discount?: number
  endsAt: Date
  serviceName?: string
  productName?: string
}

export async function getActivePromotions(): Promise<ActivePromotion[]> {
  const tenantId = await getTenantId()
  const now = new Date()

  const promotions = await prisma.promotion.findMany({
    where: {
      tenantId,
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: { service: true, product: true },
    orderBy: { endsAt: "asc" },
  })

  return promotions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? undefined,
    discount: p.discount ? Number(p.discount) : undefined,
    endsAt: p.endsAt,
    serviceName: p.service?.name,
    productName: p.product?.name,
  }))
}

export async function getMonthlyAppointmentCounts(): Promise<{ date: string; count: number }[]> {
  const tenantId = await getTenantId()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const appointments = await prisma.appointment.findMany({
    where: { tenantId, startAt: { gte: thirtyDaysAgo } },
    select: { startAt: true }
  })
  
  const countsMap = new Map<string, number>()
  
  for (const apt of appointments) {
    const dateStr = apt.startAt.toISOString().split('T')[0]
    countsMap.set(dateStr, (countsMap.get(dateStr) || 0) + 1)
  }
  
  return Array.from(countsMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
