"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Professional } from "@/lib/types"
import { createProfessionalSchema, updateProfessionalSchema } from "@/lib/validations"

interface ProfessionalWithDetails extends Professional {
  categoryName?: string
  categoryColor?: string
  todayAppointments?: number
}

function mapProfessional(prismaProf: any, todayAppointmentsCount = 0): ProfessionalWithDetails {
  // Extract category names if there are any
  // Note: the original code had categoryId directly on the Professional table
  // The new schema uses a many-to-many relationship: ProfessionalCategory
  const firstCategory = prismaProf.categories?.[0]?.category
  
  return {
    id: prismaProf.id,
    tenantId: prismaProf.tenantId,
    name: prismaProf.name,
    email: prismaProf.email ?? undefined,
    phone: prismaProf.phone ?? prismaProf.whatsapp ?? undefined,
    whatsapp: prismaProf.whatsapp ?? undefined,
    bio: prismaProf.bio ?? undefined,
    color: prismaProf.color ?? undefined,
    branchId: prismaProf.branchId ?? undefined,
    isActive: prismaProf.isActive,
    categoryId: firstCategory?.id ?? "",
    categoryName: firstCategory?.name,
    categoryColor: firstCategory?.color || undefined,
    serviceIds: prismaProf.services?.map((s: any) => s.serviceId) ?? [],
    createdAt: prismaProf.createdAt,
    updatedAt: prismaProf.updatedAt,
    deletedAt: prismaProf.deletedAt ?? undefined,
    todayAppointments: todayAppointmentsCount,
  }
}

export async function getProfessionals(): Promise<ProfessionalWithDetails[]> {
  const tenantId = await getTenantId()
  const todayStr = new Date().toISOString().split("T")[0]
  const todayStart = new Date(`${todayStr}T00:00:00Z`)
  const todayEnd = new Date(`${todayStr}T23:59:59.999Z`)

  const professionals = await prisma.professional.findMany({
    where: { tenantId },
    include: {
      categories: {
        include: { category: true }
      },
      services: true,
      _count: {
        select: {
          appointments: {
            where: {
              startAt: { gte: todayStart, lte: todayEnd },
              status: { in: ['PENDING', 'CONFIRMED'] }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  return professionals.map((prof) => mapProfessional(prof, prof._count?.appointments))
}

export async function getActiveProfessionals(): Promise<ProfessionalWithDetails[]> {
  const tenantId = await getTenantId()
  
  const professionals = await prisma.professional.findMany({
    where: { tenantId, isActive: true },
    include: {
      categories: {
        include: { category: true }
      },
      services: true
    },
    orderBy: { name: 'asc' }
  })
  
  return professionals.map((prof) => mapProfessional(prof))
}

export async function getProfessionalById(id: string): Promise<ProfessionalWithDetails | null> {
  const tenantId = await getTenantId()
  
  const professional = await prisma.professional.findUnique({
    where: { id, tenantId },
    include: {
      categories: {
        include: { category: true }
      },
      services: true
    }
  })
  
  return professional ? mapProfessional(professional) : null
}

export async function getProfessionalsByService(serviceId: string): Promise<Professional[]> {
  const tenantId = await getTenantId()
  
  const professionals = await prisma.professional.findMany({
    where: { 
      tenantId, 
      isActive: true,
      services: {
        some: { serviceId }
      }
    },
    include: {
      categories: { include: { category: true } },
      services: true
    },
    orderBy: { name: 'asc' }
  })
  
  return professionals.map((prof) => mapProfessional(prof))
}

export async function createProfessional(data: {
  name: string
  email?: string
  phone?: string
  avatarUrl?: string
  categoryId?: string
  serviceIds?: string[]
}): Promise<Professional | { error: string }> {
  const parsed = createProfessionalSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  const createData: any = {
    tenantId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
  }

  // Connect categories
  if (parsed.data.categoryId) {
    createData.categories = {
      create: [{ categoryId: parsed.data.categoryId }],
    }
  }

  // Connect services
  if (parsed.data.serviceIds?.length) {
    createData.services = {
      create: parsed.data.serviceIds.map((serviceId) => ({ serviceId })),
    }
  }

  const professional = await prisma.professional.create({
    data: createData,
    include: {
      categories: { include: { category: true } },
      services: true
    }
  })
  
  revalidatePath("/dashboard/professionals")
  return mapProfessional(professional)
}

export async function updateProfessional(
  id: string,
  data: Partial<{
    name: string
    email: string
    phone: string
    avatarUrl: string
    categoryId: string
    isActive: boolean
    serviceIds: string[]
  }>
): Promise<Professional | null> {
  const tenantId = await getTenantId()
  
  try {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if ((data as any).color !== undefined) updateData.color = (data as any).color
    if ((data as any).bio !== undefined) updateData.bio = (data as any).bio
    
    // Run in transaction to update relations
    const professional = await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      const prof = await tx.professional.update({
        where: { id, tenantId },
        data: updateData
      })
      
      // 2. Update category if provided
      if (data.categoryId !== undefined) {
        // Delete old
        await tx.professionalCategory.deleteMany({
          where: { professionalId: id }
        })
        // Add new
        if (data.categoryId) {
          await tx.professionalCategory.create({
            data: { professionalId: id, categoryId: data.categoryId }
          })
        }
      }
      
      // 3. Update services if provided
      if (data.serviceIds !== undefined) {
        // Delete old
        await tx.professionalService.deleteMany({
          where: { professionalId: id }
        })
        // Add new
        if (data.serviceIds.length > 0) {
          await tx.professionalService.createMany({
            data: data.serviceIds.map(sid => ({ professionalId: id, serviceId: sid }))
          })
        }
      }
      
      // Fetch fresh with relations
      return tx.professional.findUnique({
        where: { id },
        include: {
          categories: { include: { category: true } },
          services: true
        }
      })
    })

    revalidatePath("/dashboard/professionals")
    return professional ? mapProfessional(professional) : null
  } catch (error) {
    return null
  }
}

export async function toggleProfessionalActive(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  
  try {
    const current = await prisma.professional.findUnique({ 
      where: { id, tenantId },
      select: { isActive: true }
    })
    
    if (!current) return false
      
    await prisma.professional.update({
      where: { id, tenantId },
      data: { isActive: !current.isActive }
    })
    
    revalidatePath("/dashboard/professionals")
    return true
  } catch (error) {
    return false
  }
}

export async function deleteProfessional(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  
  try {
    await prisma.professional.delete({
      where: { id, tenantId }
    })
    revalidatePath("/dashboard/professionals")
    return true
  } catch (error) {
    return false
  }
}
