"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ServiceCategory as Category } from "@/lib/types"

interface CategoryWithStats extends Category {
  servicesCount?: number
  professionalsCount?: number
}

// Convert Prisma Category to our App Category type
function mapCategory(prismaCategory: any): CategoryWithStats {
  return {
    id: prismaCategory.id,
    tenantId: prismaCategory.tenantId,
    name: prismaCategory.name,
    color: prismaCategory.color || "",
    icon: prismaCategory.icon ?? undefined,
    description: prismaCategory.description || undefined,
    isActive: prismaCategory.isActive ?? true,
    createdAt: prismaCategory.createdAt,
    updatedAt: prismaCategory.updatedAt,
    deletedAt: prismaCategory.deletedAt ?? undefined,
    servicesCount: prismaCategory._count?.services || 0,
    professionalsCount: prismaCategory._count?.professionals || 0,
  }
}

export async function getCategories(): Promise<CategoryWithStats[]> {
  const tenantId = await getTenantId()
  const categories = await prisma.category.findMany({
    where: { tenantId, isActive: true },
    include: {
      _count: {
        select: { services: true, professionals: true }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  return categories.map(mapCategory)
}

export async function getCategoryById(id: string): Promise<CategoryWithStats | null> {
  const tenantId = await getTenantId()
  const category = await prisma.category.findUnique({
    where: { id, tenantId },
    include: {
      _count: {
        select: { services: true, professionals: true }
      }
    }
  })
  
  return category ? mapCategory(category) : null
}

export async function createCategory(data: {
  name: string
  color: string
  icon?: string
  description?: string
}): Promise<Category> {
  const tenantId = await getTenantId()
  const category = await prisma.category.create({
    data: {
      ...data,
      tenantId
    }
  })

  revalidatePath("/dashboard/categories")
  return mapCategory(category)
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string
    color: string
    icon: string
    description: string
  }>
): Promise<Category | null> {
  const tenantId = await getTenantId()
  
  try {
    const category = await prisma.category.update({
      where: { id, tenantId },
      data
    })

    revalidatePath("/dashboard/categories")
    return mapCategory(category)
  } catch (error) {
    return null
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  
  try {
    await prisma.category.delete({
      where: { id, tenantId }
    })
    revalidatePath("/dashboard/categories")
    return true
  } catch (error) {
    return false
  }
}
