import { prisma } from "@/lib/prisma"
import { fromZonedTime, toZonedTime } from "date-fns-tz"

const SLOT_STEP_MIN = 15

// "09:00" → 540
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// 540 → "09:00"
function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

const JS_DAY_TO_WEEKDAY: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
}

export interface ProfessionalSlots {
  professionalId: string
  professionalName: string
  color: string
  slots: string[] // ["09:00", "09:45", ...]
}

export async function getAvailableSlots(
  tenantId: string,
  dateStr: string, // YYYY-MM-DD (in tenant local time)
  serviceId: string,
  timezone: string,
  requestedProfessionalId?: string
): Promise<ProfessionalSlots[]> {
  // 1. Get service
  const service = await prisma.service.findUnique({
    where: { id: serviceId, tenantId },
    include: { professionals: { include: { professional: true } } },
  })
  if (!service) return []

  const { durationMin, bufferBeforeMin, bufferAfterMin } = service
  const totalBlockMin = bufferBeforeMin + durationMin + bufferAfterMin

  // 2. Get professionals who can do this service
  let professionals = service.professionals
    .filter((ps) => ps.isActive && ps.professional.isActive)
    .map((ps) => ps.professional)

  if (requestedProfessionalId) {
    professionals = professionals.filter((p) => p.id === requestedProfessionalId)
  }

  if (professionals.length === 0) return []

  // 3. Calculate the day boundaries in UTC
  const localDayStart = fromZonedTime(`${dateStr}T00:00:00`, timezone)
  const localDayEnd = fromZonedTime(`${dateStr}T23:59:59`, timezone)

  // 3b. Filter out professionals on time off for this day
  const professionalIds = professionals.map((p) => p.id)
  const timeOffs = await prisma.professionalTimeOff.findMany({
    where: {
      tenantId,
      professionalId: { in: professionalIds },
      startAt: { lte: localDayEnd },
      endAt: { gte: localDayStart },
    },
    select: { professionalId: true },
  })
  const profOnTimeOff = new Set(timeOffs.map((t) => t.professionalId))
  professionals = professionals.filter((p) => !profOnTimeOff.has(p.id))
  if (professionals.length === 0) return []

  // 4. Get day of week from the local date
  const localDate = toZonedTime(localDayStart, timezone)
  const dayOfWeek = JS_DAY_TO_WEEKDAY[localDate.getDay()]

  // 5. Get business hours for this day
  const businessHour = await prisma.businessHour.findFirst({
    where: { tenantId, dayOfWeek: dayOfWeek as any, branchId: null },
  })

  if (!businessHour || !businessHour.isOpen) return []

  const openMin = timeToMin(businessHour.startTime)
  const closeMin = timeToMin(businessHour.endTime)
  const breakStartMin = businessHour.breakStartTime ? timeToMin(businessHour.breakStartTime) : null
  const breakEndMin = businessHour.breakEndTime ? timeToMin(businessHour.breakEndTime) : null

  // 6. Get existing appointments for the relevant professionals on this date
  const availableProfessionalIds = professionals.map((p) => p.id)
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      professionalId: { in: availableProfessionalIds },
      startAt: { gte: localDayStart, lte: localDayEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { professionalId: true, startAt: true, endAt: true },
  })

  // Convert existing appointments to local minutes
  const aptsByProfessional = new Map<string, { startMin: number; endMin: number }[]>()
  for (const apt of existingAppointments) {
    const localStart = toZonedTime(apt.startAt, timezone)
    const localEnd = toZonedTime(apt.endAt, timezone)
    const startMin = localStart.getHours() * 60 + localStart.getMinutes()
    const endMin = localEnd.getHours() * 60 + localEnd.getMinutes()

    if (!aptsByProfessional.has(apt.professionalId)) {
      aptsByProfessional.set(apt.professionalId, [])
    }
    aptsByProfessional.get(apt.professionalId)!.push({ startMin, endMin })
  }

  // 7. Generate slots for each professional
  const result: ProfessionalSlots[] = []

  for (const professional of professionals) {
    const existingApts = aptsByProfessional.get(professional.id) ?? []
    const slots: string[] = []

    // blockStart = start of the full block (bufferBefore + appt + bufferAfter)
    for (
      let blockStart = openMin;
      blockStart + totalBlockMin <= closeMin;
      blockStart += SLOT_STEP_MIN
    ) {
      const apptStart = blockStart + bufferBeforeMin
      const blockEnd = blockStart + totalBlockMin

      // Skip if block overlaps with break period
      if (breakStartMin !== null && breakEndMin !== null) {
        if (blockStart < breakEndMin && blockEnd > breakStartMin) continue
      }

      // Skip if block overlaps with any existing appointment
      const hasOverlap = existingApts.some(
        (apt) => apt.startMin < blockEnd && apt.endMin > blockStart
      )
      if (hasOverlap) continue

      slots.push(minToTime(apptStart))
    }

    if (slots.length > 0) {
      result.push({
        professionalId: professional.id,
        professionalName: professional.name,
        color: professional.color ?? "#0F7A61",
        slots,
      })
    }
  }

  return result
}
