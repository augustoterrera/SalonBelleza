import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized } from "@/lib/agent-auth"

export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const professionals = await prisma.professional.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    include: {
      categories: { include: { category: { select: { name: true, color: true } } } },
      services: {
        where: { isActive: true },
        include: { service: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(
    professionals.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      bio: p.bio,
      photo: (p as any).photo ?? null,
      categories: p.categories.map((pc) => pc.category.name),
      services: p.services.map((ps) => ({ id: ps.service.id, name: ps.service.name })),
    }))
  )
}
