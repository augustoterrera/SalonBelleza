"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Service } from "@/lib/types"
import { createServiceSchema, updateServiceSchema } from "@/lib/validations"

interface ServiceWithCategory extends Service {
  duration: number  // alias de durationMin para compatibilidad con UI
  categoryName?: string
  categoryColor?: string
}

function mapService(prismaService: any): ServiceWithCategory {
  return {
    id: prismaService.id,
    tenantId: prismaService.tenantId,
    categoryId: prismaService.categoryId,
    name: prismaService.name,
    description: prismaService.description || undefined,
    durationMin: prismaService.durationMin,
    duration: prismaService.durationMin,  // alias para la UI
    price: Number(prismaService.price) || 0,
    priceIsFrom: prismaService.priceIsFrom ?? false,
    bufferBeforeMin: prismaService.bufferBeforeMin ?? 0,
    bufferAfterMin: prismaService.bufferAfterMin ?? 0,
    isActive: prismaService.isActive,
    professionalIds: prismaService.professionals?.map((p: any) => p.professionalId) || [],
    createdAt: prismaService.createdAt,
    updatedAt: prismaService.updatedAt,
    deletedAt: prismaService.deletedAt ?? undefined,
    categoryName: prismaService.category?.name,
    categoryColor: prismaService.category?.color || undefined,
  }
}

export async function getServices(): Promise<ServiceWithCategory[]> {
  const tenantId = await getTenantId()
  
  const services = await prisma.service.findMany({
    where: { tenantId, isActive: true },
    include: {
      category: true,
      professionals: true
    },
    orderBy: [
      { category: { name: 'asc' } },
      { name: 'asc' }
    ]
  })
  
  return services.map(mapService)
}

export async function getAllServices(): Promise<ServiceWithCategory[]> {
  const tenantId = await getTenantId()
  
  const services = await prisma.service.findMany({
    where: { tenantId },
    include: {
      category: true,
      professionals: true
    },
    orderBy: [
      { category: { name: 'asc' } },
      { name: 'asc' }
    ]
  })
  
  return services.map(mapService)
}

export async function getServiceById(id: string): Promise<ServiceWithCategory | null> {
  const tenantId = await getTenantId()
  
  const service = await prisma.service.findUnique({
    where: { id, tenantId },
    include: {
      category: true,
      professionals: true
    }
  })
  
  return service ? mapService(service) : null
}

export async function getServicesByCategory(categoryId: string): Promise<Service[]> {
  const tenantId = await getTenantId()
  
  const services = await prisma.service.findMany({
    where: { tenantId, categoryId, isActive: true },
    include: {
      professionals: true
    },
    orderBy: { name: 'asc' }
  })
  
  return services.map(mapService)
}

export async function createService(data: {
  name: string
  description?: string
  duration: number
  price: number
  priceIsFrom?: boolean
  categoryId: string
}): Promise<Service | { error: string }> {
  const parsed = createServiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  const service = await prisma.service.create({
    data: {
      tenantId,
      name: parsed.data.name,
      description: parsed.data.description,
      durationMin: parsed.data.duration,
      price: parsed.data.price,
      priceIsFrom: parsed.data.priceIsFrom ?? false,
      categoryId: parsed.data.categoryId,
    },
    include: {
      category: true,
      professionals: true
    }
  })

  revalidatePath("/dashboard/services")
  return mapService(service)
}

export async function updateService(
  id: string,
  data: Partial<{
    name: string
    description: string
    duration: number
    price: number
    priceIsFrom: boolean
    categoryId: string
    isActive: boolean
  }>
): Promise<Service | null | { error: string }> {
  const parsed = updateServiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  try {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.duration !== undefined) updateData.durationMin = data.duration
    if (data.price !== undefined) updateData.price = data.price
    if (data.priceIsFrom !== undefined) updateData.priceIsFrom = data.priceIsFrom
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    
    const service = await prisma.service.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        category: true,
        professionals: true
      }
    })

    revalidatePath("/dashboard/services")
    return mapService(service)
  } catch (error) {
    return null
  }
}

export async function toggleServiceActive(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  
  try {
    const current = await prisma.service.findUnique({
      where: { id, tenantId },
      select: { isActive: true }
    })
    
    if (!current) return false
      
    await prisma.service.update({
      where: { id, tenantId },
      data: { isActive: !current.isActive }
    })
    
    revalidatePath("/dashboard/services")
    return true
  } catch (error) {
    return false
  }
}

export async function deleteService(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  
  try {
    await prisma.service.delete({
      where: { id, tenantId }
    })
    revalidatePath("/dashboard/services")
    return true
  } catch (error) {
    return false
  }
}
