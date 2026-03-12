import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized } from "@/lib/agent-auth"

export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const now = new Date()

  const promotions = await prisma.promotion.findMany({
    where: {
      tenantId: ctx.tenantId,
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: {
      service: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
    orderBy: { endsAt: "asc" },
  })

  return NextResponse.json(
    promotions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      discount: p.discount ? Number(p.discount) : null,
      endsAt: p.endsAt,
      service: p.service ? { id: p.service.id, name: p.service.name } : null,
      product: p.product ? { id: p.product.id, name: p.product.name } : null,
    }))
  )
}
