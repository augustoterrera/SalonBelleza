import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized } from "@/lib/agent-auth"

export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const services = await prisma.service.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    include: {
      category: { select: { id: true, name: true, color: true } },
      professionals: {
        where: { isActive: true },
        include: { professional: { select: { id: true, name: true, isActive: true } } },
      },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })

  return NextResponse.json(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category.name,
      categoryId: s.categoryId,
      durationMin: s.durationMin,
      price: s.price ? Number(s.price) : null,
      priceIsFrom: s.priceIsFrom,
      professionals: s.professionals
        .filter((ps) => ps.professional.isActive)
        .map((ps) => ({ id: ps.professional.id, name: ps.professional.name })),
    }))
  )
}
