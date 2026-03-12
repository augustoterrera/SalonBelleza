export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type AppointmentSource = 'PANEL' | 'WHATSAPP' | 'WEB' | 'SYSTEM' | 'IMPORTED'

export interface Branch {
  id: string
  tenantId: string
  name: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Client {
  id: string
  tenantId: string
  name: string
  phone?: string
  whatsapp?: string
  email?: string
  birthDate?: Date
  notes?: string
  tags: string[]
  isActive: boolean
  lastVisitAt?: Date | null
  totalVisits: number
  noShowCount: number
  preferredCategoryId?: string
  preferredProfessionalId?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Professional {
  id: string
  tenantId: string
  branchId?: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  bio?: string
  color?: string
  // Computed from ProfessionalCategory relation (first category)
  categoryId: string
  categoryName?: string
  categoryColor?: string
  // Computed from ProfessionalService relation
  serviceIds: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface ServiceCategory {
  id: string
  tenantId: string
  name: string
  description?: string
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Service {
  id: string
  tenantId: string
  categoryId: string
  name: string
  description?: string
  durationMin: number
  price?: number
  priceIsFrom: boolean
  bufferBeforeMin: number
  bufferAfterMin: number
  isActive: boolean
  professionalIds: string[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Appointment {
  id: string
  tenantId: string
  branchId?: string
  customerId: string
  professionalId: string
  serviceId: string
  categoryId: string
  status: AppointmentStatus
  source: AppointmentSource
  startAt: Date
  endAt: Date
  durationMin: number
  price?: number
  finalPrice?: number
  serviceNameSnapshot: string
  professionalNameSnapshot: string
  categoryNameSnapshot: string
  customerNameSnapshot: string
  notes?: string
  internalNotes?: string
  cancelReason?: string
  createdByUserId?: string
  confirmedAt?: Date
  cancelledAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WorkingHours {
  dayOfWeek: number // 0-6, Sunday-Saturday
  startTime: string // HH:mm
  endTime: string   // HH:mm
  isWorking: boolean
}

export interface BusinessHours {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isOpen: boolean
}

export interface TimeSlot {
  time: string
  available: boolean
  professionalId?: string
}

export interface Product {
  id: string
  tenantId: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
