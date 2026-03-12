import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized } from "@/lib/agent-auth"

export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { name: true, phone: true, whatsapp: true, email: true, address: true, timezone: true },
  })

  const businessHours = await prisma.businessHour.findMany({
    where: { tenantId: ctx.tenantId, branchId: null },
    orderBy: { dayOfWeek: "asc" },
  })

  const DAY_NAMES: Record<string, string> = {
    MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles",
    THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
  }

  return NextResponse.json({
    name: tenant?.name,
    phone: tenant?.phone,
    whatsapp: tenant?.whatsapp,
    email: tenant?.email,
    address: tenant?.address,
    timezone: tenant?.timezone,
    businessHours: businessHours.map((h) => ({
      day: DAY_NAMES[h.dayOfWeek] ?? h.dayOfWeek,
      isOpen: h.isOpen,
      openTime: h.startTime,
      closeTime: h.endTime,
      breakStart: h.breakStartTime,
      breakEnd: h.breakEndTime,
    })),
  })
}
