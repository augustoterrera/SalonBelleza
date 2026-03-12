"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { KPICard } from "@/components/dashboard/kpi-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CalendarDays,
  Users,
  Scissors,
  TrendingUp,
  Clock,
  ChevronRight,
  Tag,
  Trophy,
} from "lucide-react"
import { format, subDays, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import type { DashboardStats, TopService, ProfessionalPerformance, ActivePromotion } from "@/lib/actions/dashboard"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface DashboardClientProps {
  stats: DashboardStats
  topServices: TopService[]
  appointments: any[]
  professionals: any[]
  appointmentCounts: { date: string; count: number }[]
  professionalPerformance: ProfessionalPerformance[]
  activePromotions: ActivePromotion[]
}

export function DashboardClient({ stats, topServices, appointments, professionals, appointmentCounts, professionalPerformance, activePromotions }: DashboardClientProps) {
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)

  const today = new Date()

  // Build last 7 days chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i)
    const dateStr = format(date, "yyyy-MM-dd")
    const found = appointmentCounts.find((c) => c.date === dateStr)
    return {
      day: format(date, "EEE", { locale: es }),
      citas: found?.count ?? 0,
      isToday: i === 6,
    }
  })

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startAt)
    return aptDate.toDateString() === today.toDateString()
  })

  const confirmedToday = todayAppointments.filter(apt => apt.status === 'CONFIRMED').length
  const pendingToday = todayAppointments.filter(apt => apt.status === 'PENDING').length

  const maxServiceCount = topServices.length > 0 ? Math.max(...topServices.map(s => s.count)) : 1

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle={format(today, "EEEE, d 'de' MMMM", { locale: es })}
        onNewAppointment={() => setAppointmentModalOpen(true)}
      />
      
      <main className="flex-1 space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Citas de hoy"
            value={stats.todayAppointments}
            description={`${confirmedToday} confirmadas, ${pendingToday} pendientes`}
            icon={CalendarDays}
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Total clientes"
            value={stats.totalClients}
            description="Clientes registrados"
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Profesionales activos"
            value={stats.activeProfessionals}
            description={`De ${professionals.length} totales`}
            icon={Scissors}
          />
          <KPICard
            title="Ocupacion diaria"
            value={`${stats.dailyOccupancy}%`}
            description="De la capacidad total"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Citas de hoy</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments" className="text-primary">
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No hay citas programadas para hoy</p>
                </div>
              ) : (
                todayAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {appointment.customerName || 'Cliente'}
                        </p>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {appointment.serviceName || 'Servicio'} con {appointment.professionalName || 'Profesional'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {format(new Date(appointment.startAt), "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.durationMin} min
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Appointments Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Citas ultimos 7 dias</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {appointmentCounts.reduce((s, c) => s + c.count, 0)} citas en los ultimos 30 dias
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments" className="text-primary">
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    width={24}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} citas`, ""]}
                    labelFormatter={(label) => label}
                  />
                  <Bar
                    dataKey="citas"
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Empleada del mes */}
        {professionalPerformance.length > 0 && (
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40 shrink-0">
                  <Trophy className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    Empleada del mes
                  </p>
                  <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100 truncate">
                    {professionalPerformance[0].professionalName}
                  </p>
                  <p className="text-sm text-yellow-700/80 dark:text-yellow-300/80">
                    {professionalPerformance[0].appointmentCount} citas · ${professionalPerformance[0].revenue.toLocaleString()} en ingresos este mes
                  </p>
                </div>
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback
                    className="text-sm text-white font-semibold"
                    style={{ backgroundColor: professionalPerformance[0].color || "#0F7A61" }}
                  >
                    {professionalPerformance[0].professionalName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Most Booked Services */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Servicios mas reservados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topServices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin datos aun</p>
              ) : (
                topServices.map(({ serviceId, serviceName, categoryColor, count }) => (
                  <div key={serviceId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span className="text-sm font-medium">{serviceName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{count} citas</span>
                    </div>
                    <Progress 
                      value={(count / maxServiceCount) * 100} 
                      className="h-2"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Professional Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Rendimiento este mes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/professionals" className="text-primary">
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {professionalPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin datos aun</p>
              ) : (
                professionalPerformance.slice(0, 5).map((prof, idx) => (
                  <div key={prof.professionalId} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className="text-xs text-white font-semibold"
                          style={{ backgroundColor: prof.color || "#0F7A61" }}
                        >
                          {prof.professionalName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {idx === 0 && (
                        <span className="absolute -top-1 -right-1 text-xs">🏆</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{prof.professionalName}</p>
                      <p className="text-xs text-muted-foreground">{prof.appointmentCount} citas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${prof.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">ingresos</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Promotions */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Promociones vigentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/promotions" className="text-primary">
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activePromotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tag className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay promociones activas en este momento</p>
                </div>
              ) : (
                activePromotions.slice(0, 5).map((promo) => {
                  const daysLeft = differenceInDays(new Date(promo.endsAt), new Date())
                  return (
                    <div key={promo.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{promo.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {promo.serviceName
                            ? `Servicio: ${promo.serviceName}`
                            : promo.productName
                            ? `Producto: ${promo.productName}`
                            : "General"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {promo.discount != null && (
                          <p className="text-sm font-medium">${promo.discount.toLocaleString()}</p>
                        )}
                        <p className={`text-xs ${daysLeft <= 3 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {daysLeft === 0 ? "Vence hoy" : `${daysLeft}d restantes`}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
        </Card>
      </main>

      <NewAppointmentModal 
        open={appointmentModalOpen} 
        onOpenChange={setAppointmentModalOpen} 
      />
    </>
  )
}
