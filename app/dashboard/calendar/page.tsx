"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal"
import { EditAppointmentModal } from "@/components/dashboard/edit-appointment-modal"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  X,
  CheckCircle,
  XCircle,
  Ban,
  Plus,
  Pencil,
} from "lucide-react"
import {
  getAppointments,
  updateAppointmentStatus,
  updateAppointment,
} from "@/lib/actions/appointments"
import type { AppointmentWithRelations } from "@/lib/actions/appointments"
import { getProfessionals } from "@/lib/actions/professionals"
import { getCategories } from "@/lib/actions/categories"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const minutes = i % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${minutes}`
}).filter((_, i) => i < 22)

export default function CalendarPage() {
  const { toast } = useToast()
  const dragRef = useRef<string | null>(null)

  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<AppointmentWithRelations | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined)
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>(undefined)
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    getAppointments().then(setAppointments)
    getProfessionals().then(setProfessionals)
    getCategories().then(setCategories)
  }, [])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedProfessional !== "all" && apt.professionalId !== selectedProfessional) return false
      if (selectedCategory !== "all") {
        const professional = professionals.find((p) => p.id === apt.professionalId)
        if (professional?.categoryId !== selectedCategory) return false
      }
      return true
    })
  }, [selectedProfessional, selectedCategory, appointments, professionals])

  const getAppointmentsForSlot = (date: Date, time: string) => {
    return filteredAppointments.filter((apt) => {
      const aptDate = new Date(apt.startAt)
      return isSameDay(aptDate, date) && format(aptDate, "HH:mm") === time
    })
  }

  const getAppointmentsForDay = (date: Date) =>
    filteredAppointments.filter((apt) => isSameDay(new Date(apt.startAt), date))

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "week") setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else if (viewMode === "day") setCurrentDate(direction === "next" ? addDays(currentDate, 1) : addDays(currentDate, -1))
    else setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  const getCategoryColor = (professionalId: string) => {
    const p = professionals.find((x) => x.id === professionalId)
    const c = categories.find((x) => x.id === p?.categoryId)
    return c?.color || "#0F7A61"
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) { setCurrentDate(date); setViewMode("day") }
  }

  const handleSlotClick = (date: Date, time: string) => {
    setPreselectedDate(date)
    setPreselectedTime(time)
    setAppointmentModalOpen(true)
  }

  const daysWithAppointments = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end }).filter((d) => getAppointmentsForDay(d).length > 0)
  }, [currentDate, filteredAppointments])

  // Status actions
  const handleConfirm = async () => {
    if (!selectedAppointment) return
    setActioning(true)
    const ok = await updateAppointmentStatus(selectedAppointment.id, "CONFIRMED")
    if (ok) {
      setAppointments((prev) => prev.map((a) => a.id === selectedAppointment.id ? { ...a, status: "CONFIRMED" } : a))
      setSelectedAppointment(null)
      toast({ title: "Cita confirmada" })
    }
    setActioning(false)
  }

  const handleCancel = async () => {
    if (!selectedAppointment) return
    setActioning(true)
    const ok = await updateAppointmentStatus(selectedAppointment.id, "CANCELLED")
    if (ok) {
      setAppointments((prev) => prev.map((a) => a.id === selectedAppointment.id ? { ...a, status: "CANCELLED" } : a))
      setSelectedAppointment(null)
      toast({ title: "Cita cancelada" })
    }
    setActioning(false)
  }

  const handleReschedule = () => {
    if (!selectedAppointment) return
    setAppointmentToEdit(selectedAppointment)
    setSelectedAppointment(null)
    setEditModalOpen(true)
  }

  // Drag & drop
  const handleDragStart = (e: React.DragEvent, appointmentId: string) => {
    dragRef.current = appointmentId
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, date: Date, time: string) => {
    e.preventDefault()
    const id = dragRef.current
    dragRef.current = null
    if (!id) return

    const result = await updateAppointment(id, {
      date: format(date, "yyyy-MM-dd"),
      time,
    })
    if (result) {
      setAppointments((prev) => prev.map((a) => a.id === id ? result : a))
      toast({ title: "Cita reagendada" })
    }
  }

  // Month view calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

  const headerTitle = () => {
    if (viewMode === "week") return `${format(weekStart, "d MMM", { locale: es })} – ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}`
    if (viewMode === "day") return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es })
    return format(currentDate, "MMMM yyyy", { locale: es })
  }

  return (
    <>
      <Header
        title="Calendario"
        subtitle="Gestiona tu agenda"
        onNewAppointment={() => setAppointmentModalOpen(true)}
      />

      <main className="flex-1 p-6">
        <div className="flex gap-6">
          {/* Mini Calendar Sidebar */}
          <div className="hidden lg:block w-[280px] flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={handleDateSelect}
                  locale={es}
                  modifiers={{ hasAppointments: daysWithAppointments }}
                  modifiersStyles={{
                    hasAppointments: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                      textDecorationColor: "#0F7A61",
                      textUnderlineOffset: "3px",
                    },
                  }}
                  className="rounded-md"
                />

                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Resumen de hoy</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Citas totales</span>
                      <span className="font-medium">{getAppointmentsForDay(new Date()).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confirmadas</span>
                      <span className="font-medium text-green-600">
                        {getAppointmentsForDay(new Date()).filter((a) => a.status === "CONFIRMED").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pendientes</span>
                      <span className="font-medium text-orange-600">
                        {getAppointmentsForDay(new Date()).filter((a) => a.status === "PENDING").length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    className="w-full gap-2"
                    onClick={() => { setPreselectedDate(new Date()); setPreselectedTime(undefined); setAppointmentModalOpen(true) }}
                  >
                    <Plus className="h-4 w-4" />
                    Nueva cita
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Calendar */}
          <Card className="flex-1">
            <CardContent className="p-4">
              {/* Controls */}
              <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>Hoy</Button>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-lg font-semibold capitalize">{headerTitle()}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex rounded-lg border">
                    <Button variant={viewMode === "day" ? "secondary" : "ghost"} size="sm" className="rounded-r-none border-r" onClick={() => setViewMode("day")}>Dia</Button>
                    <Button variant={viewMode === "week" ? "secondary" : "ghost"} size="sm" className="rounded-none border-r" onClick={() => setViewMode("week")}>Semana</Button>
                    <Button variant={viewMode === "month" ? "secondary" : "ghost"} size="sm" className="rounded-l-none" onClick={() => setViewMode("month")}>Mes</Button>
                  </div>
                </div>
              </div>

              {/* Month View */}
              {viewMode === "month" && (
                <div>
                  <div className="grid grid-cols-7 border-b mb-1">
                    {weekLabels.map((l) => (
                      <div key={l} className="py-2 text-center text-xs font-medium text-muted-foreground">{l}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                      const dayApts = getAppointmentsForDay(day)
                      const isToday = isSameDay(day, new Date())
                      const isCurrentMonth = isSameMonth(day, currentDate)
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/30 transition-colors",
                            !isCurrentMonth && "opacity-40 bg-muted/20"
                          )}
                          onClick={() => { setCurrentDate(day); setViewMode("day") }}
                        >
                          <div className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                            isToday && "bg-primary text-primary-foreground"
                          )}>
                            {format(day, "d")}
                          </div>
                          <div className="space-y-0.5">
                            {dayApts.slice(0, 3).map((apt) => (
                              <div
                                key={apt.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt) }}
                                className="text-xs text-white rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-80"
                                style={{ backgroundColor: getCategoryColor(apt.professionalId) }}
                              >
                                {format(new Date(apt.startAt), "HH:mm")} {apt.customerName}
                              </div>
                            ))}
                            {dayApts.length > 3 && (
                              <div className="text-xs text-muted-foreground px-1">+{dayApts.length - 3} más</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Week / Day View */}
              {viewMode !== "month" && (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className={cn("grid border-b", viewMode === "week" ? "grid-cols-[60px_repeat(7,1fr)]" : "grid-cols-[60px_1fr]")}>
                      <div />
                      {viewMode === "week" ? (
                        weekDays.map((day) => (
                          <div key={day.toISOString()} className={cn("p-2 text-center border-l", isSameDay(day, new Date()) && "bg-primary/5")}>
                            <p className="text-xs text-muted-foreground">{format(day, "EEE", { locale: es })}</p>
                            <p className={cn("text-lg font-semibold", isSameDay(day, new Date()) && "text-primary")}>{format(day, "d")}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center border-l bg-primary/5">
                          <p className="text-xs text-muted-foreground">{format(currentDate, "EEEE", { locale: es })}</p>
                          <p className="text-lg font-semibold text-primary">{format(currentDate, "d")}</p>
                        </div>
                      )}
                    </div>

                    {/* Time Grid */}
                    <div className="max-h-[600px] overflow-y-auto">
                      {timeSlots.map((time) => (
                        <div
                          key={time}
                          className={cn("grid border-b", viewMode === "week" ? "grid-cols-[60px_repeat(7,1fr)]" : "grid-cols-[60px_1fr]")}
                        >
                          <div className="p-2 text-right text-xs text-muted-foreground">{time}</div>
                          {viewMode === "week" ? (
                            weekDays.map((day) => {
                              const dayApts = getAppointmentsForSlot(day, time)
                              return (
                                <div
                                  key={`${day.toISOString()}-${time}`}
                                  onClick={() => dayApts.length === 0 && handleSlotClick(day, time)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, day, time)}
                                  className={cn(
                                    "min-h-[50px] border-l p-0.5 text-left transition-colors",
                                    isSameDay(day, new Date()) && "bg-primary/5",
                                    dayApts.length === 0 && "hover:bg-muted/50 cursor-pointer"
                                  )}
                                >
                                  {dayApts.map((apt) => (
                                    <div
                                      key={apt.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, apt.id)}
                                      onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt) }}
                                      className="w-full text-left rounded px-1.5 py-1 text-xs text-white mb-0.5 hover:opacity-90 transition-opacity cursor-grab active:cursor-grabbing"
                                      style={{ backgroundColor: getCategoryColor(apt.professionalId) }}
                                    >
                                      <p className="font-medium truncate">{apt.customerName}</p>
                                      <p className="truncate opacity-80">{apt.serviceName}</p>
                                    </div>
                                  ))}
                                </div>
                              )
                            })
                          ) : (
                            <div
                              onClick={() => getAppointmentsForSlot(currentDate, time).length === 0 && handleSlotClick(currentDate, time)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, currentDate, time)}
                              className={cn(
                                "min-h-[50px] border-l p-0.5 bg-primary/5 w-full text-left transition-colors",
                                getAppointmentsForSlot(currentDate, time).length === 0 && "hover:bg-primary/10 cursor-pointer"
                              )}
                            >
                              {getAppointmentsForSlot(currentDate, time).map((apt) => (
                                <div
                                  key={apt.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, apt.id)}
                                  onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt) }}
                                  className="w-full text-left rounded px-2 py-1.5 text-sm text-white mb-0.5 hover:opacity-90 transition-opacity cursor-grab active:cursor-grabbing"
                                  style={{ backgroundColor: getCategoryColor(apt.professionalId) }}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium truncate">{apt.customerName}</p>
                                    <Badge variant="secondary" className="text-xs bg-white/20 text-white">{apt.durationMin} min</Badge>
                                  </div>
                                  <p className="truncate opacity-80">{apt.serviceName} - {apt.professionalName}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalle de cita
              {selectedAppointment && <StatusBadge status={selectedAppointment.status} />}
            </DialogTitle>
            <DialogDescription>Informacion de la cita seleccionada</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedAppointment.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.customerPhone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedAppointment.startAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedAppointment.startAt), "HH:mm")} ({selectedAppointment.durationMin} min)</span>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">{selectedAppointment.serviceName}</p>
                <p className="text-sm text-muted-foreground">Con {selectedAppointment.professionalName}</p>
                {(selectedAppointment.finalPrice ?? selectedAppointment.price) != null && (
                  <p className="text-sm font-medium text-primary">
                    ${(selectedAppointment.finalPrice ?? selectedAppointment.price)?.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedAppointment(null)}>
              <X className="h-4 w-4" />Cerrar
            </Button>
            {selectedAppointment?.status !== "CONFIRMED" && selectedAppointment?.status !== "COMPLETED" && (
              <Button variant="outline" size="sm" className="gap-2 text-green-600 hover:text-green-700" onClick={handleConfirm} disabled={actioning}>
                <CheckCircle className="h-4 w-4" />Confirmar
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2 text-blue-600 hover:text-blue-700" onClick={handleReschedule}>
              <Pencil className="h-4 w-4" />Editar
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-orange-600 hover:text-orange-700" onClick={handleReschedule}>
              <Ban className="h-4 w-4" />Reagendar
            </Button>
            {selectedAppointment?.status !== "CANCELLED" && (
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700" onClick={handleCancel} disabled={actioning}>
                <XCircle className="h-4 w-4" />Cancelar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewAppointmentModal
        open={appointmentModalOpen}
        onOpenChange={(open) => {
          setAppointmentModalOpen(open)
          if (!open) { setPreselectedDate(undefined); setPreselectedTime(undefined) }
        }}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
        onSuccess={(apt) => setAppointments((prev) => [apt, ...prev])}
      />

      <EditAppointmentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        appointment={appointmentToEdit}
        onSuccess={(updated) => setAppointments((prev) => prev.map((a) => a.id === updated.id ? updated : a))}
      />
    </>
  )
}
