import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface AgentContext {
  tenantId: string
  timezone: string
}

export async function validateApiKey(req: Request): Promise<AgentContext | null> {
  const key = req.headers.get("x-api-key")
  if (!key) return null

  const tenant = await prisma.tenant.findUnique({
    where: { apiKey: key },
    select: { id: true, isActive: true, timezone: true },
  })

  if (!tenant || !tenant.isActive) return null

  return { tenantId: tenant.id, timezone: tenant.timezone }
}

export function unauthorized() {
  return NextResponse.json({ error: "API key inválida o ausente" }, { status: 401 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}
