import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized } from "@/lib/agent-auth"

export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const products = await prisma.product.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      imageUrl: p.imageUrl,
    }))
  )
}
