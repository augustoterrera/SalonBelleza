import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const getTenantId = async (): Promise<string> => {
  const session = await getSession()
  if (!session?.tenantId) {
    throw new Error("No autenticado")
  }
  return session.tenantId
}

export const getUserId = async (): Promise<string> => {
  const session = await getSession()
  if (!session?.userId) {
    throw new Error("No autenticado")
  }
  return session.userId
}

export const getTenantTimezone = async (): Promise<string> => {
  const tenantId = await getTenantId()
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { timezone: true },
  })
  return tenant?.timezone ?? "America/Argentina/Buenos_Aires"
}
