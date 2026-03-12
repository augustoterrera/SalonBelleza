import { z } from "zod"

// Auth
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  salonName: z.string().min(2, "El nombre del salon debe tener al menos 2 caracteres").max(100),
  name: z.string().min(2, "Tu nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().max(20).optional(),
  timezone: z.string().optional(),
})

// Services
export const createServiceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(5, "La duración mínima es 5 minutos").max(480, "La duración máxima es 8 horas"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  priceIsFrom: z.boolean().optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
})

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Promotions
export const createPromotionSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100),
  description: z.string().max(500).optional(),
  discount: z.number().min(0).optional(),
  startsAt: z.string().min(1, "La fecha de inicio es requerida"),
  endsAt: z.string().min(1, "La fecha de fin es requerida"),
  serviceId: z.string().optional(),
  productId: z.string().optional(),
})

export const updatePromotionSchema = createPromotionSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Clients
export const createClientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
})

export const updateClientSchema = createClientSchema.partial()

// Appointments
export const createAppointmentSchema = z.object({
  customerId: z.string().min(1),
  professionalId: z.string().min(1),
  serviceId: z.string().min(1),
  categoryId: z.string().min(1),
  branchId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:mm)"),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

// Professionals
export const createProfessionalSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  categoryId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
})

export const updateProfessionalSchema = createProfessionalSchema.partial().extend({
  isActive: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  color: z.string().optional(),
})

// Categories
export const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hexadecimal inválido"),
  description: z.string().max(200).optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// Products
export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "El precio no puede ser negativo"),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
})

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
})
