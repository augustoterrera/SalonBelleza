import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, unauthorized, badRequest } from "@/lib/agent-auth"

// POST /api/agent/customers
// Body: { phone, name?, whatsapp? }
// Returns existing or creates new customer
export async function POST(req: Request) {
  const ctx = await validateApiKey(req)
  if (!ctx) return unauthorized()

  const body = await req.json().catch(() => null)
  if (!body?.phone) return badRequest("Se requiere el campo: phone")

  const phone: string = String(body.phone).trim()

  // Look up by phone or whatsapp
  let customer = await prisma.customer.findFirst({
    where: {
      tenantId: ctx.tenantId,
      OR: [{ phone }, { whatsapp: phone }],
    },
    select: { id: true, name: true, phone: true, whatsapp: true, totalVisits: true },
  })

  if (customer) {
    return NextResponse.json({ ...customer, isNew: false })
  }

  // Create new customer
  const name: string = body.name ? String(body.name).trim() : "Cliente WhatsApp"
  const whatsapp: string = body.whatsapp ? String(body.whatsapp).trim() : phone

  customer = await prisma.customer.create({
    data: {
      tenantId: ctx.tenantId,
      name,
      phone,
      whatsapp,
      source: "WHATSAPP",
    },
    select: { id: true, name: true, phone: true, whatsapp: true, totalVisits: true },
  })

  return NextResponse.json({ ...customer, isNew: true }, { status: 201 })
}
