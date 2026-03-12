"use server"

import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { loginSchema, registerSchema } from "@/lib/validations"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function loginAction(data: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, isActive: true },
    include: { tenant: true },
  })

  if (!user || !user.passwordHash) {
    return { error: "Email o contraseña incorrectos" }
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!valid) {
    return { error: "Email o contraseña incorrectos" }
  }

  await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    name: user.name,
    email: user.email,
  })

  redirect("/dashboard")
}

export async function registerAction(data: {
  salonName: string
  name: string
  email: string
  password: string
  phone?: string
  timezone?: string
}) {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { salonName, name, email, password, phone, timezone } = parsed.data

  const existing = await prisma.user.findFirst({ where: { email } })
  if (existing) {
    return { error: "Ya existe una cuenta con ese email" }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  let slug = generateSlug(salonName)
  const slugExists = await prisma.tenant.findUnique({ where: { slug } })
  if (slugExists) {
    slug = `${slug}-${Date.now()}`
  }

  const resolvedTimezone = timezone || "America/Argentina/Buenos_Aires"

  const { user, tenant } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: salonName,
        slug,
        phone: phone || null,
        timezone: resolvedTimezone,
      },
    })

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        passwordHash,
        role: "OWNER",
      },
    })

    // Horarios por defecto: Lun–Sab 9–19, Domingo cerrado
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const
    await tx.businessHour.createMany({
      data: days.map((day) => ({
        tenantId: tenant.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "19:00",
        isOpen: day !== "SUNDAY",
      })),
    })

    return { user, tenant }
  })

  await createSession({
    userId: user.id,
    tenantId: tenant.id,
    role: user.role,
    name: user.name,
    email: user.email,
  })

  redirect("/onboarding")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}
