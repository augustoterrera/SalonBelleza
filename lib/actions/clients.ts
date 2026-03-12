"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Client } from "@/lib/types"
import { createClientSchema, updateClientSchema } from "@/lib/validations"

// Function to map Prisma Customer to App Client type
function mapClient(prismaCustomer: any, stats?: { totalVisits: number, totalSpent: number, lastVisit: Date | null }): Client {
  return {
    id: prismaCustomer.id,
    name: prismaCustomer.name,
    email: prismaCustomer.email || "",
    phone: prismaCustomer.phone || "",
    whatsapp: prismaCustomer.whatsapp || "",
    notes: prismaCustomer.notes || undefined,
    createdAt: prismaCustomer.createdAt,
    // Add dynamically computed stats
    totalVisits: stats?.totalVisits || 0,
    totalSpent: stats?.totalSpent || 0,
    lastVisit: stats?.lastVisit || null,
  } as Client & { totalVisits: number, totalSpent: number, lastVisit: Date | null }
}

async function getClientStats(customerId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { customerId, status: 'COMPLETED' as any }, // Using any while enum mismatches exist
    select: { price: true, startAt: true }
  })
  
  const totalVisits = appointments.length
  const totalSpent = appointments.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)
  
  // Get latest appointment
  const latestAppt = appointments.sort((a, b) => b.startAt.getTime() - a.startAt.getTime())[0]
  const lastVisit = latestAppt ? latestAppt.startAt : null
  
  return { totalVisits, totalSpent, lastVisit }
}

export async function getClients(): Promise<Client[]> {
  const tenantId = await getTenantId()
  const customers = await prisma.customer.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' }
  })

  const clientsWithStats = await Promise.all(
    customers.map(async (customer) => {
      const stats = await getClientStats(customer.id)
      return mapClient(customer, stats)
    })
  )

  return clientsWithStats
}

export async function getClientsPaginated(params: {
  page?: number
  pageSize?: number
  search?: string
} = {}): Promise<{ data: (Client & { totalVisits: number; totalSpent: number; lastVisitAt: Date | null })[]; total: number }> {
  const tenantId = await getTenantId()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const where: any = { tenantId, isActive: true }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
      { whatsapp: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
    prisma.customer.count({ where }),
  ])

  if (customers.length === 0) return { data: [], total }

  // Fix N+1: una sola query agrupada para las stats de todos los clientes de la página
  const customerIds = customers.map(c => c.id)
  const statsRaw = await prisma.appointment.groupBy({
    by: ['customerId'],
    where: { tenantId, customerId: { in: customerIds }, status: 'COMPLETED' },
    _count: { _all: true },
    _sum: { price: true },
    _max: { startAt: true },
  })

  const statsMap = new Map(statsRaw.map(s => [s.customerId, s]))

  const data = customers.map(c => {
    const s = statsMap.get(c.id)
    return {
      ...mapClient(c),
      totalVisits: s?._count._all ?? 0,
      totalSpent: Number(s?._sum.price ?? 0),
      lastVisitAt: s?._max.startAt ?? null,
    }
  })

  return { data, total }
}

export async function getClientById(id: string): Promise<Client | null> {
  const tenantId = await getTenantId()
  const customer = await prisma.customer.findUnique({
    where: { id, tenantId }
  })
  
  if (!customer) return null
  
  const stats = await getClientStats(customer.id)
  return mapClient(customer, stats)
}

export async function searchClients(searchTerm: string): Promise<Client[]> {
  const tenantId = await getTenantId()
  const customers = await prisma.customer.findMany({
    where: { 
      tenantId, 
      isActive: true,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    orderBy: { name: 'asc' },
    take: 20
  })
  
  const clientsWithStats = await Promise.all(
    customers.map(async (customer) => {
      const stats = await getClientStats(customer.id)
      return mapClient(customer, stats)
    })
  )
  
  return clientsWithStats
}

export async function createClient(data: {
  name: string
  phone?: string
  whatsapp?: string
  email?: string
  notes?: string
}): Promise<Client | { error: string }> {
  const parsed = createClientSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()
  const customer = await prisma.customer.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      tenantId,
    },
  })
  
  revalidatePath("/dashboard/clients")
  return mapClient(customer)
}

export async function updateClient(
  id: string,
  data: Partial<{
    name: string
    phone: string
    whatsapp: string
    email: string
    notes: string
  }>
): Promise<Client | null | { error: string }> {
  const parsed = updateClientSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  try {
    const customer = await prisma.customer.update({
      where: { id, tenantId },
      data: parsed.data,
    })

    revalidatePath("/dashboard/clients")
    const stats = await getClientStats(customer.id)
    return mapClient(customer, stats)
  } catch (error) {
    return null
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  
  try {
    // Soft delete since the schema has isActive
    await prisma.customer.update({
      where: { id, tenantId },
      data: { isActive: false }
    })
    revalidatePath("/dashboard/clients")
    return true
  } catch (error) {
    return false
  }
}

// updateClientStats is effectively deprecated since stats are now dynamically computed from appointments.
// We keep an empty function to avoid breaking other files that import it.
export async function updateClientStats(clientId: string, amount: number): Promise<void> {
  // Stats are dynamically calculated from the appointments table now.
  revalidatePath("/dashboard/clients")
}
