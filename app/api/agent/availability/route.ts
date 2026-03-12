import { NextResponse } from "next/server"
import { validateApiKey, unauthorized, badRequest } from "@/lib/agent-auth"
import { getAvailableSlots } from "@/lib/availability"

// GET /api/agent/availability?date=2026-03-15&serviceId=xxx&professionalId=xxx (optional)
export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const serviceId = searchParams.get("serviceId")
  const professionalId = searchParams.get("professionalId") ?? undefined

  if (!date || !serviceId) {
    return badRequest("Se requieren los parámetros: date (YYYY-MM-DD) y serviceId")
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return badRequest("Formato de fecha inválido. Use YYYY-MM-DD")
  }

  const slots = await getAvailableSlots(
    ctx.tenantId,
    date,
    serviceId,
    ctx.timezone,
    professionalId
  )

  return NextResponse.json({ date, slots })
}
