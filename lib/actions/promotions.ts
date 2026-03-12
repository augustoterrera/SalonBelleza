"use server"

import { prisma } from "@/lib/prisma"
import { getTenantId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createPromotionSchema, updatePromotionSchema } from "@/lib/validations"

function mapPromotion(p: any) {
  return {
    id: p.id,
    tenantId: p.tenantId,
    title: p.title,
    description: p.description || undefined,
    discount: p.discount ? Number(p.discount) : undefined,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    isActive: p.isActive,
    serviceId: p.serviceId || undefined,
    productId: p.productId || undefined,
    serviceName: p.service?.name,
    productName: p.product?.name,
  }
}

export async function getPromotions() {
  const tenantId = await getTenantId()
  const promotions = await prisma.promotion.findMany({
    where: { tenantId },
    include: { service: true, product: true },
    orderBy: { endsAt: "desc" },
  })
  return promotions.map(mapPromotion)
}

export async function createPromotion(data: {
  title: string
  description?: string
  discount?: number
  startsAt: string
  endsAt: string
  serviceId?: string
  productId?: string
}): Promise<{ id: string } | { error: string }> {
  const parsed = createPromotionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  const promotion = await prisma.promotion.create({
    data: {
      tenantId,
      title: parsed.data.title,
      description: parsed.data.description,
      discount: parsed.data.discount,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      serviceId: parsed.data.serviceId || null,
      productId: parsed.data.productId || null,
    },
    include: { service: true, product: true },
  })

  revalidatePath("/dashboard/promotions")
  return mapPromotion(promotion)
}

export async function updatePromotion(
  id: string,
  data: Partial<{
    title: string
    description: string
    discount: number
    startsAt: string
    endsAt: string
    serviceId: string
    productId: string
    isActive: boolean
  }>
): Promise<{ id: string } | { error: string } | null> {
  const parsed = updatePromotionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tenantId = await getTenantId()

  try {
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.discount !== undefined) updateData.discount = data.discount
    if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt)
    if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt)
    if (data.serviceId !== undefined) updateData.serviceId = data.serviceId || null
    if (data.productId !== undefined) updateData.productId = data.productId || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const promotion = await prisma.promotion.update({
      where: { id, tenantId },
      data: updateData,
      include: { service: true, product: true },
    })

    revalidatePath("/dashboard/promotions")
    return mapPromotion(promotion)
  } catch {
    return null
  }
}

export async function togglePromotionActive(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  try {
    const current = await prisma.promotion.findUnique({
      where: { id, tenantId },
      select: { isActive: true },
    })
    if (!current) return false
    await prisma.promotion.update({
      where: { id, tenantId },
      data: { isActive: !current.isActive },
    })
    revalidatePath("/dashboard/promotions")
    return true
  } catch {
    return false
  }
}

export async function deletePromotion(id: string): Promise<boolean> {
  const tenantId = await getTenantId()
  try {
    await prisma.promotion.delete({ where: { id, tenantId } })
    revalidatePath("/dashboard/promotions")
    return true
  } catch {
    return false
  }
}
