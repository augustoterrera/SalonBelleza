import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized, badRequest } from "@/lib/agent-auth"

// PATCH /api/agent/appointments/:id/cancel
// Body: { reason? }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason: string | null = body.reason ?? null

  const appointment = await prisma.appointment.findUnique({
    where: { id, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  if (appointment.status === "CANCELLED") {
    return badRequest("El turno ya está cancelado")
  }

  if (appointment.status === "COMPLETED") {
    return badRequest("No se puede cancelar un turno completado")
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelReason: reason,
      cancelledAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, message: "Turno cancelado correctamente" })
}
