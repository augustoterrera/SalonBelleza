"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId, getTenantTimezone } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Appointment, AppointmentStatus, AppointmentSource } from "@/lib/types"
import { fromZonedTime } from "date-fns-tz"
import { createAppointmentSchema } from "@/lib/validations"

export interface AppointmentWithRelations extends Appointment {
  // Populated relations for display
  customerName: string
  customerPhone?: string
  professionalName: string
  serviceName: string
  categoryName?: string
  categoryColor?: string
}

function mapAppointment(prismaAppt: any): AppointmentWithRelations {
  const startAt = new Date(prismaAppt.startAt)
  const endAt = new Date(prismaAppt.endAt)

  return {
    id: prismaAppt.id,
    tenantId: prismaAppt.tenantId,
    branchId: prismaAppt.branchId ?? undefined,
    customerId: prismaAppt.customerId,
    professionalId: prismaAppt.professionalId,
    serviceId: prismaAppt.serviceId,
    categoryId: prismaAppt.categoryId ?? "",
    status: prismaAppt.status as AppointmentStatus,
    source: (prismaAppt.source ?? "PANEL") as AppointmentSource,
    startAt,
    endAt,
    // durationMin is now stored in DB; fall back to computing it for old records
    durationMin: prismaAppt.durationMin ?? Math.round((endAt.getTime() - startAt.getTime()) / 60000),
    price: prismaAppt.price != null ? Number(prismaAppt.price) : undefined,
    finalPrice: prismaAppt.finalPrice != null ? Number(prismaAppt.finalPrice) : undefined,
    // Snapshot fields — fall back to relation names for old records without snapshots
    serviceNameSnapshot: prismaAppt.serviceNameSnapshot ?? prismaAppt.service?.name ?? "",
    professionalNameSnapshot: prismaAppt.professionalNameSnapshot ?? prismaAppt.professional?.name ?? "",
    categoryNameSnapshot: prismaAppt.categoryNameSnapshot ?? prismaAppt.service?.category?.name ?? "",
    customerNameSnapshot: prismaAppt.customerNameSnapshot ?? prismaAppt.customer?.name ?? "",
    notes: prismaAppt.notes ?? undefined,
    internalNotes: prismaAppt.internalNotes ?? undefined,
    cancelReason: prismaAppt.cancelReason ?? undefined,
    createdByUserId: prismaAppt.createdByUserId ?? undefined,
    confirmedAt: prismaAppt.confirmedAt ? new Date(prismaAppt.confirmedAt) : undefined,
    cancelledAt: prismaAppt.cancelledAt ? new Date(prismaAppt.cancelledAt) : undefined,
    completedAt: prismaAppt.completedAt ? new Date(prismaAppt.completedAt) : undefined,
    createdAt: new Date(prismaAppt.createdAt),
    updatedAt: new Date(prismaAppt.updatedAt),

    // Populated relations
    customerName: prismaAppt.customer?.name ?? prismaAppt.customerNameSnapshot ?? "",
    customerPhone: prismaAppt.customer?.phone ?? prismaAppt.customer?.whatsapp ?? undefined,
    professionalName: prismaAppt.professional?.name ?? prismaAppt.professionalNameSnapshot ?? "",
    serviceName: prismaAppt.service?.name ?? prismaAppt.serviceNameSnapshot ?? "",
    categoryName: prismaAppt.service?.category?.name ?? prismaAppt.categoryNameSnapshot ?? undefined,
    categoryColor: prismaAppt.service?.category?.color ?? undefined,
  }
}

const defaultInclude = {
  customer: true,
  professional: true,
  service: {
    include: { category: true }
  }
}

export async function getAppointments(filters?: {
  date?: string
  startDate?: string
  endDate?: string
  professionalId?: string
  status?: AppointmentStatus
  customerId?: string
  branchId?: string
  categoryId?: string
  source?: AppointmentSource
}): Promise<AppointmentWithRelations[]> {
  const tenantId = await getTenantId()

  const where: any = { tenantId }

  if (filters?.date) {
    const startOfDay = new Date(`${filters.date}T00:00:00Z`)
    const endOfDay = new Date(`${filters.date}T23:59:59.999Z`)
    where.startAt = { gte: startOfDay, lte: endOfDay }
  } else if (filters?.startDate || filters?.endDate) {
    where.startAt = {}
    if (filters.startDate) where.startAt.gte = new Date(`${filters.startDate}T00:00:00Z`)
    if (filters.endDate) where.startAt.lte = new Date(`${filters.endDate}T23:59:59.999Z`)
  }

  if (filters?.professionalId) where.professionalId = filters.professionalId
  if (filters?.status) where.status = filters.status
  if (filters?.customerId) where.customerId = filters.customerId
  if (filters?.branchId) where.branchId = filters.branchId
  if (filters?.categoryId) where.categoryId = filters.categoryId
  if (filters?.source) where.source = filters.source

  const appointments = await prisma.appointment.findMany({
    where,
    include: defaultInclude,
    orderBy: { startAt: 'asc' }
  })

  return appointments.map(mapAppointment)
}

export async function getAppointmentsPaginated(params: {
  page?: number
  pageSize?: number
  search?: string
  status?: AppointmentStatus
  categoryId?: string
  professionalId?: string
  startDate?: string  // YYYY-MM-DD
  endDate?: string    // YYYY-MM-DD
} = {}): Promise<{ data: AppointmentWithRelations[]; total: number }> {
  const tenantId = await getTenantId()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 25
  const skip = (page - 1) * pageSize

  const where: any = { tenantId }

  if (params.search) {
    where.OR = [
      { customerNameSnapshot: { contains: params.search, mode: 'insensitive' } },
      { serviceNameSnapshot: { contains: params.search, mode: 'insensitive' } },
      { professionalNameSnapshot: { contains: params.search, mode: 'insensitive' } },
    ]
  }
  if (params.status) where.status = params.status
  if (params.categoryId) where.categoryId = params.categoryId
  if (params.professionalId) where.professionalId = params.professionalId
  if (params.startDate || params.endDate) {
    where.startAt = {}
    if (params.startDate) where.startAt.gte = new Date(`${params.startDate}T00:00:00Z`)
    if (params.endDate) where.startAt.lte = new Date(`${params.endDate}T23:59:59.999Z`)
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: defaultInclude,
      orderBy: { startAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ])

  return { data: appointments.map(mapAppointment), total }
}

export async function getAppointmentById(id: string): Promise<AppointmentWithRelations | null> {
  const tenantId = await getTenantId()
  const appointment = await prisma.appointment.findUnique({
    where: { id, tenantId },
    include: defaultInclude
  })

  return appointment ? mapAppointment(appointment) : null
}

export async function getTodayAppointments(): Promise<AppointmentWithRelations[]> {
  const today = new Date().toISOString().split("T")[0]
  return getAppointments({ date: today })
}

export async function getUpcomingAppointments(limit = 5): Promise<AppointmentWithRelations[]> {
  const tenantId = await getTenantId()
  const now = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startAt: { gte: now },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    include: defaultInclude,
    orderBy: { startAt: 'asc' },
    take: limit
  })

  return appointments.map(mapAppointment)
}

export async function createAppointment(data: {
  customerId: string
  professionalId: string
  serviceId: string
  categoryId: string
  branchId?: string
  date: string   // YYYY-MM-DD
  time: string   // HH:mm
  durationMin: number
  price?: number
  notes?: string
  source?: AppointmentSource
  createdByUserId?: string
}): Promise<AppointmentWithRelations | { error: string }> {
  const parsed = createAppointmentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()
  const timezone = await getTenantTimezone()

  // Convertir hora local del tenant a UTC
  const startAt = fromZonedTime(`${data.date}T${data.time}:00`, timezone)
  const endAt = new Date(startAt.getTime() + data.durationMin * 60000)

  // Fetch snapshot data
  const [customer, professional, service] = await Promise.all([
    prisma.customer.findUnique({ where: { id: data.customerId }, select: { name: true } }),
    prisma.professional.findUnique({ where: { id: data.professionalId }, select: { name: true } }),
    prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { category: { select: { name: true } } }
    })
  ])

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      branchId: data.branchId,
      customerId: data.customerId,
      professionalId: data.professionalId,
      serviceId: data.serviceId,
      categoryId: data.categoryId,
      startAt,
      endAt,
      durationMin: data.durationMin,
      status: 'PENDING',
      source: data.source ?? 'PANEL',
      price: data.price,
      customerNameSnapshot: customer?.name ?? "",
      professionalNameSnapshot: professional?.name ?? "",
      serviceNameSnapshot: service?.name ?? "",
      categoryNameSnapshot: service?.category?.name ?? "",
      notes: data.notes,
      createdByUserId: data.createdByUserId,
    },
    include: defaultInclude
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/appointments")
  revalidatePath("/dashboard/calendar")

  return mapAppointment(appointment)
}

export async function updateAppointment(
  id: string,
  data: Partial<{
    customerId: string
    professionalId: string
    serviceId: string
    categoryId: string
    date: string
    time: string
    durationMin: number
    status: AppointmentStatus
    notes: string
    internalNotes: string
    price: number
    finalPrice: number
    cancelReason: string
  }>
): Promise<AppointmentWithRelations | null> {
  const tenantId = await getTenantId()

  try {
    const updateData: any = {}

    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.professionalId !== undefined) updateData.professionalId = data.professionalId
    if (data.serviceId !== undefined) updateData.serviceId = data.serviceId
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes
    if (data.price !== undefined) updateData.price = data.price
    if (data.finalPrice !== undefined) updateData.finalPrice = data.finalPrice
    if (data.cancelReason !== undefined) updateData.cancelReason = data.cancelReason
    if (data.status !== undefined) updateData.status = data.status

    if (data.date || data.time || data.durationMin) {
      const existing = await prisma.appointment.findUnique({ where: { id, tenantId } })
      if (!existing) return null

      const timezone = await getTenantTimezone()
      const { toZonedTime, format } = await import("date-fns-tz")

      const existingLocal = toZonedTime(existing.startAt, timezone)
      const currDate = format(existingLocal, "yyyy-MM-dd", { timeZone: timezone })
      const currTime = format(existingLocal, "HH:mm", { timeZone: timezone })
      const currDuration = existing.durationMin ?? Math.round((existing.endAt.getTime() - existing.startAt.getTime()) / 60000)

      const newDate = data.date ?? currDate
      const newTime = data.time ?? currTime
      const newDuration = data.durationMin ?? currDuration

      updateData.startAt = fromZonedTime(`${newDate}T${newTime}:00`, timezone)
      updateData.endAt = new Date(updateData.startAt.getTime() + newDuration * 60000)
      updateData.durationMin = newDuration
    }

    // Set timestamps based on status transition
    if (data.status === 'CONFIRMED') updateData.confirmedAt = new Date()
    if (data.status === 'CANCELLED') updateData.cancelledAt = new Date()
    if (data.status === 'COMPLETED') updateData.completedAt = new Date()

    const appointment = await prisma.appointment.update({
      where: { id, tenantId },
      data: updateData,
      include: defaultInclude
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/appointments")
    revalidatePath("/dashboard/calendar")

    return mapAppointment(appointment)
  } catch {
    return null
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<boolean> {
  const tenantId = await getTenantId()

  try {
    const timestamps: any = {}
    if (status === 'CONFIRMED') timestamps.confirmedAt = new Date()
    if (status === 'CANCELLED') timestamps.cancelledAt = new Date()
    if (status === 'COMPLETED') timestamps.completedAt = new Date()

    await prisma.appointment.update({
      where: { id, tenantId },
      data: { status, ...timestamps }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/appointments")
    revalidatePath("/dashboard/calendar")
    return true
  } catch {
    return false
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const tenantId = await getTenantId()

  try {
    await prisma.appointment.delete({ where: { id, tenantId } })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/appointments")
    revalidatePath("/dashboard/calendar")
    return true
  } catch {
    return false
  }
}

export async function getAppointmentStats(date?: string) {
  const tenantId = await getTenantId()
  const targetDate = date ?? new Date().toISOString().split("T")[0]

  const startOfDay = new Date(`${targetDate}T00:00:00Z`)
  const endOfDay = new Date(`${targetDate}T23:59:59.999Z`)

  const stats = await prisma.appointment.groupBy({
    by: ['status'],
    where: { tenantId, startAt: { gte: startOfDay, lte: endOfDay } },
    _count: true
  })

  const result = { total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0, noShow: 0 }

  for (const stat of stats) {
    result.total += stat._count
    if (stat.status === 'CONFIRMED') result.confirmed = stat._count
    if (stat.status === 'PENDING') result.pending = stat._count
    if (stat.status === 'COMPLETED') result.completed = stat._count
    if (stat.status === 'CANCELLED') result.cancelled = stat._count
    if (stat.status === 'NO_SHOW') result.noShow = stat._count
  }

  return result
}
