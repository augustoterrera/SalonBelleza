import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized, badRequest } from "@/lib/agent-auth"
import { fromZonedTime } from "date-fns-tz"

// GET /api/agent/appointments?phone=xxx
// Returns active/upcoming appointments for a customer by phone
export async function GET(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const { searchParams } = new URL(req.url)
  const phone = searchParams.get("phone")
  if (!phone) return badRequest("Se requiere el parámetro: phone")

  const customer = await prisma.customer.findFirst({
    where: {
      tenantId: ctx.tenantId,
      OR: [{ phone }, { whatsapp: phone }],
    },
    select: { id: true, name: true },
  })

  if (!customer) {
    return NextResponse.json({ appointments: [] })
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: ctx.tenantId,
      customerId: customer.id,
      startAt: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      serviceNameSnapshot: true,
      professionalNameSnapshot: true,
      price: true,
    },
  })

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name },
    appointments: appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      endAt: a.endAt,
      status: a.status,
      service: a.serviceNameSnapshot,
      professional: a.professionalNameSnapshot,
      price: a.price ? Number(a.price) : null,
    })),
  })
}

// POST /api/agent/appointments
// Body: { customerId, serviceId, professionalId, date, time, notes? }
export async function POST(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const body = await req.json().catch(() => null)
  if (!body) return badRequest("Body inválido")

  const { customerId, serviceId, professionalId, date, time, notes } = body

  if (!customerId || !serviceId || !professionalId || !date || !time) {
    return badRequest("Faltan campos requeridos: customerId, serviceId, professionalId, date, time")
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return badRequest("Formato inválido. date: YYYY-MM-DD, time: HH:mm")
  }

  // Load related entities
  const [customer, service, professional] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId, tenantId: ctx.tenantId } }),
    prisma.service.findUnique({
      where: { id: serviceId, tenantId: ctx.tenantId },
      include: { category: true },
    }),
    prisma.professional.findUnique({ where: { id: professionalId, tenantId: ctx.tenantId } }),
  ])

  if (!customer) return badRequest("Cliente no encontrado")
  if (!service) return badRequest("Servicio no encontrado")
  if (!professional) return badRequest("Profesional no encontrado")

  // Convert local date+time to UTC
  const startAt = fromZonedTime(`${date}T${time}:00`, ctx.timezone)
  const endAt = new Date(startAt.getTime() + service.durationMin * 60 * 1000)

  // Check for conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: ctx.tenantId,
      professionalId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  })

  if (conflict) {
    return NextResponse.json(
      { error: "El profesional ya tiene un turno en ese horario" },
      { status: 409 }
    )
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: ctx.tenantId,
      customerId,
      serviceId,
      professionalId,
      categoryId: service.categoryId,
      startAt,
      endAt,
      durationMin: service.durationMin,
      price: service.price,
      status: "PENDING",
      source: "WHATSAPP",
      serviceNameSnapshot: service.name,
      professionalNameSnapshot: professional.name,
      categoryNameSnapshot: service.category.name,
      customerNameSnapshot: customer.name,
      customerPhoneSnapshot: customer.phone ?? undefined,
      customerWhatsappSnapshot: customer.whatsapp ?? undefined,
      notes: notes ?? null,
    },
  })

  return NextResponse.json(
    {
      id: appointment.id,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      service: service.name,
      professional: professional.name,
      price: service.price ? Number(service.price) : null,
    },
    { status: 201 }
  )
}
