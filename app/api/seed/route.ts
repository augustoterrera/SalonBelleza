import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  // Solo disponible en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const tenantId = 'clxyz123mocktenantid'

    // ── Limpieza (orden inverso a FK) ──────────────────────────────────────
    await prisma.messageLog.deleteMany({ where: { tenantId } })
    await prisma.appointment.deleteMany({ where: { tenantId } })
    await prisma.saleItem.deleteMany({ where: { sale: { tenantId } } })
    await prisma.sale.deleteMany({ where: { tenantId } })
    await prisma.promotion.deleteMany({ where: { tenantId } })
    await prisma.calendarBlock.deleteMany({ where: { tenantId } })
    await prisma.professionalTimeOff.deleteMany({ where: { tenantId } })
    await prisma.professionalHour.deleteMany({ where: { tenantId } })
    await prisma.businessHour.deleteMany({ where: { tenantId } })
    await prisma.professionalService.deleteMany({ where: { professional: { tenantId } } })
    await prisma.professionalCategory.deleteMany({ where: { professional: { tenantId } } })
    await prisma.professional.deleteMany({ where: { tenantId } })
    await prisma.customer.deleteMany({ where: { tenantId } })
    await prisma.service.deleteMany({ where: { tenantId } })
    await prisma.category.deleteMany({ where: { tenantId } })
    await prisma.product.deleteMany({ where: { tenantId } })
    await prisma.automation.deleteMany({ where: { tenantId } })
    await prisma.user.deleteMany({ where: { tenantId } })
    await prisma.branch.deleteMany({ where: { tenantId } })
    await prisma.tenant.deleteMany({ where: { id: tenantId } })

    // ── Tenant ─────────────────────────────────────────────────────────────
    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Salon Belleza Demo',
        slug: 'salon-demo',
        phone: '+54 11 4000-0000',
        whatsapp: '+5491140000000',
        email: 'demo@salonbelleza.com',
        address: 'Av. Corrientes 1234, Buenos Aires',
        timezone: 'America/Argentina/Buenos_Aires',
        plan: 'PRO',
        isActive: true,
      },
    })

    // ── Branch ─────────────────────────────────────────────────────────────
    const branch1 = await prisma.branch.create({
      data: {
        id: 'branch_1',
        tenantId,
        name: 'Sucursal Palermo',
        phone: '+54 11 4001-0001',
        whatsapp: '+5491140010001',
        email: 'palermo@salonbelleza.com',
        address: 'Thames 1500, Palermo, Buenos Aires',
        isActive: true,
      },
    })

    await prisma.branch.create({
      data: {
        id: 'branch_2',
        tenantId,
        name: 'Sucursal Belgrano',
        phone: '+54 11 4002-0002',
        email: 'belgrano@salonbelleza.com',
        address: 'Cabildo 2000, Belgrano, Buenos Aires',
        isActive: true,
      },
    })

    // ── Users ──────────────────────────────────────────────────────────────
    const demoPasswordHash = await bcrypt.hash('demo1234', 10)

    await prisma.user.create({
      data: {
        id: 'user_owner',
        tenantId,
        name: 'Admin Demo',
        email: 'admin@salonbelleza.com',
        passwordHash: demoPasswordHash,
        role: 'OWNER',
        isActive: true,
      },
    })

    await prisma.user.create({
      data: {
        id: 'user_recep',
        tenantId,
        branchId: branch1.id,
        name: 'Recepcionista Demo',
        email: 'recepcion@salonbelleza.com',
        role: 'RECEPTIONIST',
        isActive: true,
      },
    })

    // ── Categories ─────────────────────────────────────────────────────────
    const cat1 = await prisma.category.create({ data: { id: 'cat_1', tenantId, name: 'Cabello',    description: 'Cortes, tintes y tratamientos capilares', color: '#0F7A61' } })
    const cat2 = await prisma.category.create({ data: { id: 'cat_2', tenantId, name: 'Manicura',   description: 'Uñas y cuidado de manos',                 color: '#EC4899' } })
    const cat3 = await prisma.category.create({ data: { id: 'cat_3', tenantId, name: 'Depilacion', description: 'Depilacion laser y cera',                  color: '#F59E0B' } })
    const cat4 = await prisma.category.create({ data: { id: 'cat_4', tenantId, name: 'Facial',     description: 'Tratamientos faciales y limpiezas',        color: '#8B5CF6' } })
    const cat5 = await prisma.category.create({ data: { id: 'cat_5', tenantId, name: 'Maquillaje', description: 'Maquillaje artistico y social',            color: '#EF4444' } })

    // ── Services ───────────────────────────────────────────────────────────
    const srv1  = await prisma.service.create({ data: { id: 'srv_1',  tenantId, categoryId: cat1.id, name: 'Corte de cabello',          durationMin: 45,  price: 2500,  bufferAfterMin: 5  } })
    const srv2  = await prisma.service.create({ data: { id: 'srv_2',  tenantId, categoryId: cat1.id, name: 'Tinte completo',            durationMin: 120, price: 8000,  bufferAfterMin: 10 } })
    const srv3  = await prisma.service.create({ data: { id: 'srv_3',  tenantId, categoryId: cat1.id, name: 'Mechas',                    durationMin: 150, price: 12000, bufferAfterMin: 10 } })
    const srv4  = await prisma.service.create({ data: { id: 'srv_4',  tenantId, categoryId: cat1.id, name: 'Brushing',                  durationMin: 30,  price: 1800  } })
    const srv5  = await prisma.service.create({ data: { id: 'srv_5',  tenantId, categoryId: cat2.id, name: 'Manicura clasica',          durationMin: 30,  price: 1500  } })
    const srv6  = await prisma.service.create({ data: { id: 'srv_6',  tenantId, categoryId: cat2.id, name: 'Manicura semipermanente',   durationMin: 45,  price: 2500  } })
    const srv7  = await prisma.service.create({ data: { id: 'srv_7',  tenantId, categoryId: cat2.id, name: 'Pedicura completa',         durationMin: 60,  price: 3500  } })
    const srv8  = await prisma.service.create({ data: { id: 'srv_8',  tenantId, categoryId: cat3.id, name: 'Depilacion piernas',        durationMin: 45,  price: 3000  } })
    const srv9  = await prisma.service.create({ data: { id: 'srv_9',  tenantId, categoryId: cat3.id, name: 'Depilacion cuerpo completo',durationMin: 90,  price: 7000  } })
    const srv10 = await prisma.service.create({ data: { id: 'srv_10', tenantId, categoryId: cat3.id, name: 'Depilacion zona bikini',    durationMin: 30,  price: 2200  } })
    const srv11 = await prisma.service.create({ data: { id: 'srv_11', tenantId, categoryId: cat4.id, name: 'Limpieza facial',           durationMin: 60,  price: 4500  } })
    const srv12 = await prisma.service.create({ data: { id: 'srv_12', tenantId, categoryId: cat4.id, name: 'Tratamiento anti-edad',     durationMin: 75,  price: 8500  } })
    const srv13 = await prisma.service.create({ data: { id: 'srv_13', tenantId, categoryId: cat4.id, name: 'Hidratacion profunda',      durationMin: 50,  price: 5000  } })
    const srv14 = await prisma.service.create({ data: { id: 'srv_14', tenantId, categoryId: cat5.id, name: 'Maquillaje social',         durationMin: 60,  price: 6000  } })
    const srv15 = await prisma.service.create({ data: { id: 'srv_15', tenantId, categoryId: cat5.id, name: 'Maquillaje de novia',       durationMin: 120, price: 15000 } })

    // ── Professionals ──────────────────────────────────────────────────────
    const p1 = await prisma.professional.create({
      data: {
        id: 'prof_1', tenantId, branchId: branch1.id,
        name: 'Maria Garcia', phone: '+54 11 5000-0001', color: '#0F7A61',
        bio: 'Especialista en colorimetria y tratamientos capilares con 10 años de experiencia.',
        categories: { create: [{ categoryId: cat1.id }] },
        services:   { create: [{ serviceId: srv1.id }, { serviceId: srv2.id }, { serviceId: srv3.id }, { serviceId: srv4.id }] },
      },
    })

    const p2 = await prisma.professional.create({
      data: {
        id: 'prof_2', tenantId, branchId: branch1.id,
        name: 'Juan Rodriguez', phone: '+54 11 5000-0002', color: '#3B82F6',
        categories: { create: [{ categoryId: cat1.id }] },
        services:   { create: [{ serviceId: srv1.id }, { serviceId: srv2.id }, { serviceId: srv4.id }] },
      },
    })

    const p3 = await prisma.professional.create({
      data: {
        id: 'prof_3', tenantId,
        name: 'Ana Martinez', phone: '+54 11 5000-0003', color: '#F59E0B',
        bio: 'Especialista en depilacion laser y cera brasileña.',
        categories: { create: [{ categoryId: cat3.id }] },
        services:   { create: [{ serviceId: srv8.id }, { serviceId: srv9.id }, { serviceId: srv10.id }] },
      },
    })

    const p4 = await prisma.professional.create({
      data: {
        id: 'prof_4', tenantId, branchId: branch1.id,
        name: 'Laura Sanchez', phone: '+54 11 5000-0004', color: '#EC4899',
        categories: { create: [{ categoryId: cat2.id }] },
        services:   { create: [{ serviceId: srv5.id }, { serviceId: srv6.id }, { serviceId: srv7.id }] },
      },
    })

    const p5 = await prisma.professional.create({
      data: {
        id: 'prof_5', tenantId,
        name: 'Carmen Lopez', phone: '+54 11 5000-0005', color: '#8B5CF6',
        bio: 'Esteticista facial certificada con especialidad en tratamientos anti-edad.',
        categories: { create: [{ categoryId: cat4.id }] },
        services:   { create: [{ serviceId: srv11.id }, { serviceId: srv12.id }, { serviceId: srv13.id }] },
      },
    })

    const p6 = await prisma.professional.create({
      data: {
        id: 'prof_6', tenantId,
        name: 'Valeria Romero', phone: '+54 11 5000-0006', color: '#EF4444',
        categories: { create: [{ categoryId: cat5.id }] },
        services:   { create: [{ serviceId: srv14.id }, { serviceId: srv15.id }] },
      },
    })

    // ── Business Hours (Tenant) ────────────────────────────────────────────
    const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'] as const
    for (const day of days) {
      await prisma.businessHour.create({
        data: {
          tenantId,
          dayOfWeek: day,
          startTime: day === 'SUNDAY' ? '10:00' : '09:00',
          endTime:   day === 'SUNDAY' ? '14:00' : '20:00',
          isOpen:    true,
        },
      })
    }

    // ── Professional Hours ─────────────────────────────────────────────────
    const workDays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'] as const
    for (const prof of [p1, p2, p3, p4, p5, p6]) {
      for (const day of workDays) {
        await prisma.professionalHour.create({
          data: {
            tenantId,
            professionalId: prof.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime:   '18:00',
            isWorking: day !== 'SATURDAY' || prof.id !== p3.id,
          },
        })
      }
    }

    // ── Customers ──────────────────────────────────────────────────────────
    const c1 = await prisma.customer.create({ data: { id: 'cust_1', tenantId, name: 'Sofia Hernandez',  phone: '+54 9 11 6000-0001', whatsapp: '+5491160000001', email: 'sofia@mail.com',    notes: 'Prefiere citas por la mañana',       totalVisits: 8,  tags: ['VIP', 'fiel'] } })
    const c2 = await prisma.customer.create({ data: { id: 'cust_2', tenantId, name: 'Elena Torres',     phone: '+54 9 11 6000-0002', whatsapp: '+5491160000002',                            totalVisits: 3 } })
    const c3 = await prisma.customer.create({ data: { id: 'cust_3', tenantId, name: 'Patricia Ruiz',    phone: '+54 9 11 6000-0003',                                                        notes: 'Alergia a ciertos productos quimicos', totalVisits: 5,  tags: ['alergica'] } })
    const c4 = await prisma.customer.create({ data: { id: 'cust_4', tenantId, name: 'Isabel Diaz',      phone: '+54 9 11 6000-0004', whatsapp: '+5491160000004',                            totalVisits: 2 } })
    const c5 = await prisma.customer.create({ data: { id: 'cust_5', tenantId, name: 'Lucia Moreno',     phone: '+54 9 11 6000-0005',                                                        totalVisits: 6 } })
    const c6 = await prisma.customer.create({ data: { id: 'cust_6', tenantId, name: 'Andrea Jimenez',   phone: '+54 9 11 6000-0006', whatsapp: '+5491160000006', email: 'andrea@mail.com',  notes: 'Cliente VIP, descuento especial',    totalVisits: 12, tags: ['VIP'] } })
    const c7 = await prisma.customer.create({ data: { id: 'cust_7', tenantId, name: 'Gabriela Perez',   phone: '+54 9 11 6000-0007',                                                        totalVisits: 1 } })
    const c8 = await prisma.customer.create({ data: { id: 'cust_8', tenantId, name: 'Fernanda Castillo',phone: '+54 9 11 6000-0008', whatsapp: '+5491160000008',                            totalVisits: 4 } })

    // ── Appointments ───────────────────────────────────────────────────────
    const today = new Date()
    const d = (h: number, m: number, plusDays = 0) =>
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + plusDays, h, m)

    const snap = (customer: string, professional: string, service: string, category: string) => ({
      customerNameSnapshot:    customer,
      professionalNameSnapshot: professional,
      serviceNameSnapshot:     service,
      categoryNameSnapshot:    category,
    })

    // Hoy
    const app1 = await prisma.appointment.create({ data: { tenantId, customerId: c1.id, serviceId: srv1.id,  professionalId: p1.id, categoryId: cat1.id, durationMin: 45,  status: 'CONFIRMED', startAt: d(9,0),    endAt: d(9,45),   price: 2500, ...snap('Sofia Hernandez',   'Maria Garcia',   'Corte de cabello',        'Cabello')    } })
    await prisma.appointment.create({ data: { tenantId, customerId: c2.id, serviceId: srv5.id,  professionalId: p4.id, categoryId: cat2.id, durationMin: 30,  status: 'PENDING',   startAt: d(9,30),   endAt: d(10,0),   price: 1500, ...snap('Elena Torres',       'Laura Sanchez',  'Manicura clasica',        'Manicura')   } })
    await prisma.appointment.create({ data: { tenantId, customerId: c3.id, serviceId: srv8.id,  professionalId: p3.id, categoryId: cat3.id, durationMin: 45,  status: 'CONFIRMED', startAt: d(10,0),   endAt: d(10,45),  price: 3000, ...snap('Patricia Ruiz',      'Ana Martinez',   'Depilacion piernas',      'Depilacion') } })
    await prisma.appointment.create({ data: { tenantId, customerId: c4.id, serviceId: srv2.id,  professionalId: p1.id, categoryId: cat1.id, durationMin: 120, status: 'PENDING',   startAt: d(11,0),   endAt: d(13,0),   price: 8000, ...snap('Isabel Diaz',        'Maria Garcia',   'Tinte completo',          'Cabello')    } })
    await prisma.appointment.create({ data: { tenantId, customerId: c5.id, serviceId: srv11.id, professionalId: p5.id, categoryId: cat4.id, durationMin: 60,  status: 'CONFIRMED', startAt: d(14,0),   endAt: d(15,0),   price: 4500, ...snap('Lucia Moreno',       'Carmen Lopez',   'Limpieza facial',         'Facial')     } })
    await prisma.appointment.create({ data: { tenantId, customerId: c6.id, serviceId: srv6.id,  professionalId: p4.id, categoryId: cat2.id, durationMin: 45,  status: 'PENDING',   startAt: d(15,30),  endAt: d(16,15),  price: 2500, ...snap('Andrea Jimenez',     'Laura Sanchez',  'Manicura semipermanente', 'Manicura')   } })
    await prisma.appointment.create({ data: { tenantId, customerId: c7.id, serviceId: srv14.id, professionalId: p6.id, categoryId: cat5.id, durationMin: 60,  status: 'PENDING',   startAt: d(17,0),   endAt: d(18,0),   price: 6000, ...snap('Gabriela Perez',     'Valeria Romero', 'Maquillaje social',       'Maquillaje') } })
    // Manana
    await prisma.appointment.create({ data: { tenantId, customerId: c1.id, serviceId: srv3.id,  professionalId: p1.id, categoryId: cat1.id, durationMin: 150, status: 'CONFIRMED', startAt: d(10,0,1), endAt: d(12,30,1),price: 12000,...snap('Sofia Hernandez',   'Maria Garcia',   'Mechas',                  'Cabello')    } })
    await prisma.appointment.create({ data: { tenantId, customerId: c2.id, serviceId: srv12.id, professionalId: p5.id, categoryId: cat4.id, durationMin: 75,  status: 'CONFIRMED', startAt: d(11,0,1), endAt: d(12,15,1),price: 8500, ...snap('Elena Torres',       'Carmen Lopez',   'Tratamiento anti-edad',   'Facial')     } })
    await prisma.appointment.create({ data: { tenantId, customerId: c8.id, serviceId: srv9.id,  professionalId: p3.id, categoryId: cat3.id, durationMin: 90,  status: 'PENDING',   startAt: d(14,0,1), endAt: d(15,30,1),price: 7000, ...snap('Fernanda Castillo',  'Ana Martinez',   'Depilacion cuerpo completo','Depilacion')} })
    // Pasado manana
    await prisma.appointment.create({ data: { tenantId, customerId: c6.id, serviceId: srv15.id, professionalId: p6.id, categoryId: cat5.id, durationMin: 120, status: 'CONFIRMED', startAt: d(10,0,2), endAt: d(12,0,2), price: 15000,...snap('Andrea Jimenez',     'Valeria Romero', 'Maquillaje de novia',     'Maquillaje') } })
    await prisma.appointment.create({ data: { tenantId, customerId: c5.id, serviceId: srv13.id, professionalId: p5.id, categoryId: cat4.id, durationMin: 50,  status: 'PENDING',   startAt: d(11,0,2), endAt: d(11,50,2),price: 5000, ...snap('Lucia Moreno',       'Carmen Lopez',   'Hidratacion profunda',    'Facial')     } })
    // Ayer (completadas)
    await prisma.appointment.create({ data: { tenantId, customerId: c3.id, serviceId: srv4.id,  professionalId: p1.id, categoryId: cat1.id, durationMin: 30,  status: 'COMPLETED', startAt: d(9,0,-1), endAt: d(9,30,-1),price: 1800, finalPrice: 1800, completedAt: d(9,30,-1), ...snap('Patricia Ruiz', 'Maria Garcia', 'Brushing', 'Cabello') } })
    await prisma.appointment.create({ data: { tenantId, customerId: c4.id, serviceId: srv7.id,  professionalId: p4.id, categoryId: cat2.id, durationMin: 60,  status: 'COMPLETED', startAt: d(10,0,-1),endAt: d(11,0,-1),price: 3500, finalPrice: 3500, completedAt: d(11,0,-1), ...snap('Isabel Diaz',   'Laura Sanchez','Pedicura completa','Manicura') } })
    await prisma.appointment.create({ data: { tenantId, customerId: c7.id, serviceId: srv5.id,  professionalId: p4.id, categoryId: cat2.id, durationMin: 30,  status: 'CANCELLED', startAt: d(14,0,-1),endAt: d(14,30,-1),price: 1500, cancelReason: 'No se presentó', cancelledAt: d(13,0,-1), ...snap('Gabriela Perez','Laura Sanchez','Manicura clasica','Manicura') } })

    // ── Calendar Blocks ────────────────────────────────────────────────────
    await prisma.calendarBlock.create({
      data: {
        tenantId, scope: 'PROFESSIONAL', professionalId: p1.id,
        type: 'LUNCH', title: 'Almuerzo',
        startAt: d(13,0), endAt: d(14,0),
      },
    })

    await prisma.calendarBlock.create({
      data: {
        tenantId, scope: 'TENANT',
        type: 'HOLIDAY', title: 'Dia feriado nacional',
        description: 'Salon cerrado por feriado',
        startAt: d(0,0,7), endAt: d(23,59,7),
      },
    })

    await prisma.calendarBlock.create({
      data: {
        tenantId, scope: 'PROFESSIONAL', professionalId: p3.id,
        type: 'MEETING', title: 'Capacitacion depilacion laser',
        startAt: d(9,0,3), endAt: d(13,0,3),
      },
    })

    // ── Professional Time Offs ─────────────────────────────────────────────
    await prisma.professionalTimeOff.create({
      data: {
        tenantId, professionalId: p2.id,
        startAt: d(0,0,5), endAt: d(23,59,5),
        reason: 'Vacaciones',
      },
    })

    // ── Products ───────────────────────────────────────────────────────────
    const prod1 = await prisma.product.create({ data: { id: 'prod_1', tenantId, name: 'Shampoo Keratina 500ml',     description: 'Shampoo profesional con keratina',       price: 3500, isActive: true } })
    const prod2 = await prisma.product.create({ data: { id: 'prod_2', tenantId, name: 'Mascara Hidratante 250ml',   description: 'Mascara capilar hidratacion profunda',    price: 4200, isActive: true } })
    const prod3 = await prisma.product.create({ data: { id: 'prod_3', tenantId, name: 'Esmalte semipermanente',     description: 'Set de esmaltes semipermanentes 12 colores',price: 5800, isActive: true } })
    const prod4 = await prisma.product.create({ data: { id: 'prod_4', tenantId, name: 'Crema facial antioxidante',  description: 'Crema de uso diario con vitamina C',      price: 7200, isActive: true } })
    const prod5 = await prisma.product.create({ data: { id: 'prod_5', tenantId, name: 'Aceite post-depilacion',     description: 'Aceite calmante para uso post-depilacion', price: 2800, isActive: true } })

    // ── Promotions ─────────────────────────────────────────────────────────
    await prisma.promotion.create({
      data: {
        tenantId, serviceId: srv2.id,
        title: '20% OFF Tinte completo',
        description: 'Promocion valida de lunes a miercoles',
        discount: 20,
        startsAt: d(0,0,-1),
        endsAt: d(23,59,30),
        isActive: true,
      },
    })

    await prisma.promotion.create({
      data: {
        tenantId, productId: prod1.id,
        title: 'Shampoo + Mascara combo',
        description: '15% de descuento al llevar los dos productos',
        discount: 15,
        startsAt: d(0,0,0),
        endsAt: d(23,59,14),
        isActive: true,
      },
    })

    // ── Sales ──────────────────────────────────────────────────────────────
    const sale1 = await prisma.sale.create({
      data: {
        id: 'sale_1', tenantId, customerId: c1.id,
        total: 7700,
        items: {
          create: [
            { productId: prod1.id, price: 3500, quantity: 1 },
            { productId: prod2.id, price: 4200, quantity: 1 },
          ],
        },
      },
    })

    await prisma.sale.create({
      data: {
        id: 'sale_2', tenantId, customerId: c6.id,
        total: 12400,
        items: {
          create: [
            { productId: prod3.id, price: 5800, quantity: 1 },
            { productId: prod4.id, price: 7200, quantity: 1 },
            { serviceId: srv5.id,  price: 1500, quantity: 1 },
          ],
        },
      },
    })

    // ── Automations ────────────────────────────────────────────────────────
    await prisma.automation.create({
      data: {
        tenantId, name: 'Recordatorio 24hs',
        type: 'REMINDER_24H',
        message: 'Hola {nombre}! Te recordamos tu turno mañana a las {hora} con {profesional}. Respondé SI para confirmar o NO para cancelar.',
        triggerMin: -1440,
        isActive: true,
      },
    })

    await prisma.automation.create({
      data: {
        tenantId, name: 'Recordatorio 2hs',
        type: 'REMINDER_2H',
        message: 'Hola {nombre}! Tu turno es hoy a las {hora}. ¡Te esperamos!',
        triggerMin: -120,
        isActive: true,
      },
    })

    await prisma.automation.create({
      data: {
        tenantId, name: 'Mensaje post-servicio',
        type: 'FOLLOWUP',
        message: 'Gracias por visitarnos, {nombre}! Esperamos verte pronto. Recordá que podés reservar tu próximo turno en nuestra web.',
        triggerMin: 60,
        isActive: false,
      },
    })

    // ── Message Logs ───────────────────────────────────────────────────────
    await prisma.messageLog.create({
      data: {
        tenantId, customerId: c1.id, appointmentId: app1.id,
        channel: 'WHATSAPP',
        message: 'Hola Sofia! Te recordamos tu turno mañana a las 09:00 con Maria Garcia.',
        status: 'SENT',
      },
    })

    await prisma.messageLog.create({
      data: {
        tenantId, customerId: c6.id,
        channel: 'WHATSAPP',
        message: 'Gracias por visitarnos, Andrea! Esperamos verte pronto.',
        status: 'DELIVERED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Base de datos poblada correctamente.',
      summary: {
        tenant: 1, branches: 2, users: 2,
        categories: 5, services: 15, professionals: 6,
        customers: 8, appointments: 16,
        products: 5, promotions: 2, sales: 2,
        automations: 3, messageLogs: 2,
        businessHours: 7, professionalHours: 36,
        calendarBlocks: 3, timeOffs: 1,
      },
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
