"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { WeekDay } from "@prisma/client"

// ---------------------------------------------------------------------------
// Business Settings
// Currently NOT IN SCHEMA. This is a mock implementation until added to schema.prisma
// ---------------------------------------------------------------------------
export interface BusinessSettings {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
  timezone: string
  currency: string
}

export async function getApiKey(): Promise<string | null> {
  const tenantId = await getTenantId()
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { apiKey: true } })
  return tenant?.apiKey ?? null
}

export async function generateApiKey(): Promise<string> {
  const tenantId = await getTenantId()
  const { randomBytes } = await import("crypto")
  const newKey = randomBytes(32).toString("hex")
  await prisma.tenant.update({ where: { id: tenantId }, data: { apiKey: newKey } })
  revalidatePath("/dashboard/settings")
  return newKey
}

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const tenantId = await getTenantId()
  // Mock implementation returning tenant info as business settings
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return null
  
  return {
    id: tenant.id,
    name: tenant.name,
    address: tenant.address || undefined,
    phone: tenant.phone || undefined,
    email: tenant.email || undefined,
    logoUrl: (tenant as any).logoUrl || undefined,
    timezone: tenant.timezone,
    currency: "ARS" // Mock default
  }
}

export async function updateBusinessSettings(data: Partial<{
  name: string
  address: string
  phone: string
  email: string
  logoUrl: string
  timezone: string
  currency: string
}>): Promise<BusinessSettings | null> {
  const tenantId = await getTenantId()
  
  // Map partial update to Tenant model
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.address !== undefined) updateData.address = data.address
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.email !== undefined) updateData.email = data.email
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null
  if (data.timezone !== undefined) updateData.timezone = data.timezone
  
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData
  })

  revalidatePath("/dashboard/settings")
  return getBusinessSettings()
}

// ---------------------------------------------------------------------------
// Business Hours
// ---------------------------------------------------------------------------
export interface BusinessHourFrontend {
  id: string
  dayOfWeek: number
  openTime?: string
  closeTime?: string
  breakStartTime?: string  // inicio del corte (horario cortado)
  breakEndTime?: string    // fin del corte (horario cortado)
  isClosed: boolean
}

// Helper to map Prisma WeekDay to JS day integer (Sunday=0, Monday=1, ..., Saturday=6)
function getDayNumber(day: WeekDay): number {
  const days: Record<WeekDay, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
  }
  return days[day]
}

function getWeekDay(dayNum: number): WeekDay {
  const days: WeekDay[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  return days[dayNum] || 'MONDAY'
}

export async function getBusinessHours(): Promise<BusinessHourFrontend[]> {
  const tenantId = await getTenantId()
  
  const hours = await prisma.businessHour.findMany({
    where: { tenantId }
  })
  
  // Ensure we return 7 days even if empty in DB
  const result: BusinessHourFrontend[] = []
  const hoursByDay = new Map(hours.map(h => [getDayNumber(h.dayOfWeek), h]))
  
  for (let i = 0; i < 7; i++) {
    const dbHour = hoursByDay.get(i)
    if (dbHour) {
      result.push({
        id: dbHour.id,
        dayOfWeek: i,
        openTime: dbHour.startTime,
        closeTime: dbHour.endTime,
        breakStartTime: dbHour.breakStartTime ?? undefined,
        breakEndTime: dbHour.breakEndTime ?? undefined,
        isClosed: !dbHour.isOpen,
      })
    } else {
      result.push({
        id: `temp-${i}`,
        dayOfWeek: i,
        openTime: "09:00",
        closeTime: "19:00",
        isClosed: i === 0 || i === 6,
      })
    }
  }
  
  return result.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
}

export async function updateBusinessHour(
  dayOfWeek: number,
  data: {
    openTime?: string
    closeTime?: string
    breakStartTime?: string | null
    breakEndTime?: string | null
    isClosed: boolean
  }
): Promise<BusinessHourFrontend | null> {
  const tenantId = await getTenantId()
  const weekDay = getWeekDay(dayOfWeek)

  const hourData = {
    startTime: data.openTime || "09:00",
    endTime: data.closeTime || "19:00",
    breakStartTime: data.breakStartTime ?? null,
    breakEndTime: data.breakEndTime ?? null,
    isOpen: !data.isClosed,
  }

  let hour = await prisma.businessHour.findFirst({
    where: { tenantId, dayOfWeek: weekDay },
  })

  if (hour) {
    hour = await prisma.businessHour.update({
      where: { id: hour.id },
      data: hourData,
    })
  } else {
    hour = await prisma.businessHour.create({
      data: { tenantId, dayOfWeek: weekDay, ...hourData },
    })
  }

  revalidatePath("/dashboard/hours")
  return {
    id: hour.id,
    dayOfWeek,
    openTime: hour.startTime,
    closeTime: hour.endTime,
    breakStartTime: hour.breakStartTime ?? undefined,
    breakEndTime: hour.breakEndTime ?? undefined,
    isClosed: !hour.isOpen,
  }
}

// Actualiza todos los días de golpe (útil para onboarding)
export async function updateAllBusinessHours(
  schedule: {
    openTime: string
    closeTime: string
    breakStartTime?: string | null
    breakEndTime?: string | null
    openDays: number[]  // 0=Dom … 6=Sab
  }
): Promise<void> {
  const tenantId = await getTenantId()

  const days = [0, 1, 2, 3, 4, 5, 6]
  for (const dayNum of days) {
    const weekDay = getWeekDay(dayNum)
    const isOpen = schedule.openDays.includes(dayNum)

    const hourData = {
      startTime: schedule.openTime,
      endTime: schedule.closeTime,
      breakStartTime: schedule.breakStartTime ?? null,
      breakEndTime: schedule.breakEndTime ?? null,
      isOpen,
    }

    const existing = await prisma.businessHour.findFirst({
      where: { tenantId, dayOfWeek: weekDay },
    })

    if (existing) {
      await prisma.businessHour.update({
        where: { id: existing.id },
        data: hourData,
      })
    } else {
      await prisma.businessHour.create({
        data: { tenantId, dayOfWeek: weekDay, ...hourData },
      })
    }
  }

  revalidatePath("/dashboard/hours")
  revalidatePath("/onboarding")
}

// ---------------------------------------------------------------------------
// Automations
// Currently NOT IN SCHEMA. This is a mock implementation until added to schema.prisma
// ---------------------------------------------------------------------------
export interface Automation {
  id: string
  name: string
  type: string
  messageTemplate: string
  triggerHours?: number
  isActive: boolean
}

// Simple in-memory mock for now
let mockAutomations: Automation[] = [
  { id: '1', name: 'Confirmación', type: 'confirmation', messageTemplate: 'Tu cita está confirmada', isActive: true },
  { id: '2', name: 'Recordatorio', type: 'reminder', messageTemplate: 'Recuerda tu cita', triggerHours: 24, isActive: true }
]

export async function getAutomations(): Promise<Automation[]> {
  return mockAutomations
}

export async function createAutomation(data: {
  name: string
  type: string
  messageTemplate: string
  triggerHours?: number
}): Promise<Automation> {
  const newAuto = {
    id: Date.now().toString(),
    ...data,
    isActive: true
  }
  mockAutomations.push(newAuto)
  revalidatePath("/dashboard/automations")
  return newAuto
}

export async function updateAutomation(
  id: string,
  data: Partial<{
    name: string
    type: string
    messageTemplate: string
    triggerHours: number
    isActive: boolean
  }>
): Promise<Automation | null> {
  const idx = mockAutomations.findIndex(a => a.id === id)
  if (idx === -1) return null
  
  mockAutomations[idx] = { ...mockAutomations[idx], ...data }
  revalidatePath("/dashboard/automations")
  return mockAutomations[idx]
}

export async function toggleAutomationActive(id: string): Promise<boolean> {
  const idx = mockAutomations.findIndex(a => a.id === id)
  if (idx === -1) return false
  
  mockAutomations[idx].isActive = !mockAutomations[idx].isActive
  revalidatePath("/dashboard/automations")
  return true
}

export async function deleteAutomation(id: string): Promise<boolean> {
  const initLen = mockAutomations.length
  mockAutomations = mockAutomations.filter(a => a.id !== id)
  revalidatePath("/dashboard/automations")
  return mockAutomations.length < initLen
}

// ---------------------------------------------------------------------------
// WhatsApp Config
// Currently NOT IN SCHEMA. This is a mock implementation until added to schema.prisma
// ---------------------------------------------------------------------------
export interface WhatsAppConfig {
  id: string
  phoneNumber?: string
  apiKey?: string
  isConnected: boolean
  messagesSent: number
  lastSync?: Date
}

let mockWaConfig: WhatsAppConfig = {
  id: '1',
  isConnected: false,
  messagesSent: 0
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  return mockWaConfig
}

export async function updateWhatsAppConfig(data: Partial<{
  phoneNumber: string
  apiKey: string
  isConnected: boolean
}>): Promise<WhatsAppConfig | null> {
  mockWaConfig = { ...mockWaConfig, ...data }
  revalidatePath("/dashboard/whatsapp")
  return mockWaConfig
}

export async function incrementWhatsAppMessageCount(): Promise<void> {
  mockWaConfig.messagesSent++
  mockWaConfig.lastSync = new Date()
}
