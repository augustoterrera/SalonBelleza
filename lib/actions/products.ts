"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Product } from "@/lib/types"
import { createProductSchema, updateProductSchema } from "@/lib/validations"

function mapProduct(p: any): Product {
  return {
    id: p.id,
    tenantId: p.tenantId,
    name: p.name,
    description: p.description ?? undefined,
    price: Number(p.price),
    imageUrl: p.imageUrl ?? undefined,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt ?? undefined,
  }
}

export async function getProducts(): Promise<Product[]> {
  const tenantId = await getTenantId()
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  })
  return products.map(mapProduct)
}

export async function getAllProducts(): Promise<Product[]> {
  const tenantId = await getTenantId()
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: "asc" },
  })
  return products.map(mapProduct)
}

export async function getProductsPaginated(params: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
} = {}): Promise<{ data: Product[]; total: number }> {
  const tenantId = await getTenantId()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const where: any = { tenantId, deletedAt: null }
  if (params.isActive !== undefined) where.isActive = params.isActive
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
    prisma.product.count({ where }),
  ])

  return { data: products.map(mapProduct), total }
}

export async function createProduct(data: {
  name: string
  description?: string
  price: number
  imageUrl?: string
}): Promise<Product | { error: string }> {
  const parsed = createProductSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  const product = await prisma.product.create({
    data: {
      tenantId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl || null,
    },
  })

  revalidatePath("/dashboard/products")
  return mapProduct(product)
}

export async function updateProduct(
  id: string,
  data: {
    name?: string
    description?: string
    price?: number
    imageUrl?: string
    isActive?: boolean
  }
): Promise<Product | null | { error: string }> {
  const parsed = updateProductSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  try {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.price !== undefined) updateData.price = data.price
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const product = await prisma.product.update({
      where: { id, tenantId },
      data: updateData,
    })

    revalidatePath("/dashboard/products")
    return mapProduct(product)
  } catch {
    return null
  }
}

export async function toggleProductActive(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  try {
    const current = await prisma.product.findUnique({
      where: { id, tenantId },
      select: { isActive: true },
    })
    if (!current) return false
    await prisma.product.update({
      where: { id, tenantId },
      data: { isActive: !current.isActive },
    })
    revalidatePath("/dashboard/products")
    return true
  } catch {
    return false
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  try {
    await prisma.product.delete({ where: { id, tenantId } })
    revalidatePath("/dashboard/products")
    return true
  } catch {
    return false
  }
}
