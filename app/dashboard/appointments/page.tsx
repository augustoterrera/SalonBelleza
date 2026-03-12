"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal"
import { EditAppointmentModal } from "@/components/dashboard/edit-appointment-modal"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { DataPagination } from "@/components/ui/data-pagination"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  MessageSquare,
  Eye,
  Clock,
  User,
  DollarSign,
  CheckCircle2,
  Loader2,
  CalendarRange,
  Pencil,
} from "lucide-react"
import {
  getAppointmentsPaginated,
  updateAppointmentStatus,
  deleteAppointment,
  updateAppointment,
} from "@/lib/actions/appointments"
import { getCategories } from "@/lib/actions/categories"
import type { AppointmentStatus } from "@/lib/types"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

const PAGE_SIZE = 25

type DatePreset = "all" | "today" | "week" | "month" | "custom"

function getDateRange(preset: DatePreset, customStart: string, customEnd: string) {
  const now = new Date()
  const toStr = (d: Date) => format(d, "yyyy-MM-dd")
  switch (preset) {
    case "today": return { startDate: toStr(now), endDate: toStr(now) }
    case "week": return {
      startDate: toStr(startOfWeek(now, { weekStartsOn: 1 })),
      endDate: toStr(endOfWeek(now, { weekStartsOn: 1 })),
    }
    case "month": return { startDate: toStr(startOfMonth(now)), endDate: toStr(endOfMonth(now)) }
    case "custom": return {
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    }
    default: return { startDate: undefined, endDate: undefined }
  }
}

export default function AppointmentsPage() {
  const searchParams = useSearchParams()

  // Data + pagination
  const [appointments, setAppointments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [professionalFilter] = useState<string>(
    searchParams.get("professional") || "all"
  )
  const [datePreset, setDatePreset] = useState<DatePreset>("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modals
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<any | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [cancelingAppointment, setCancelingAppointment] = useState<any | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [deletingAppointment, setDeletingAppointment] = useState<any | null>(null)
  const [actioning, setActioning] = useState(false)

  // Debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [searchQuery])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [statusFilter, categoryFilter, datePreset, customStartDate, customEndDate])

  // Load categories once
  useEffect(() => { getCategories().then(setCategories) }, [])

  // Fetch page
  useEffect(() => {
    setLoading(true)
    const { startDate, endDate } = getDateRange(datePreset, customStartDate, customEndDate)
    getAppointmentsPaginated({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter !== "all" ? statusFilter as AppointmentStatus : undefined,
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      professionalId: professionalFilter !== "all" ? professionalFilter : undefined,
      startDate,
      endDate,
    })
      .then(({ data, total }) => { setAppointments(data); setTotal(total) })
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, statusFilter, categoryFilter, professionalFilter, datePreset, customStartDate, customEndDate])

  const getCategoryColor = (categoryId?: string) => {
    const category = categories.find((c: any) => c.id === categoryId)
    return category?.color || "#0F7A61"
  }

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    setActioning(true)
    try {
      const ok = await updateAppointmentStatus(id, status)
      if (ok) {
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
        if (selectedAppointment?.id === id) setSelectedAppointment((p: any) => ({ ...p, status }))
      }
    } finally {
      setActioning(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelingAppointment) return
    setActioning(true)
    try {
      const updated = await updateAppointment(cancelingAppointment.id, {
        status: "CANCELLED",
        cancelReason: cancelReason || undefined,
      })
      if (updated) {
        setAppointments((prev) => prev.map((a) => (a.id === cancelingAppointment.id ? updated : a)))
        if (selectedAppointment?.id === cancelingAppointment.id) setSelectedAppointment(updated)
      }
      setCancelingAppointment(null)
      setCancelReason("")
    } finally {
      setActioning(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAppointment) return
    setActioning(true)
    try {
      const ok = await deleteAppointment(deletingAppointment.id)
      if (ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== deletingAppointment.id))
        setTotal((t) => t - 1)
        if (selectedAppointment?.id === deletingAppointment.id) setSelectedAppointment(null)
      }
      setDeletingAppointment(null)
    } finally {
      setActioning(false)
    }
  }

  return (
    <>
      <Header
        title="Citas"
        subtitle={`${total} citas totales`}
        onNewAppointment={() => setAppointmentModalOpen(true)}
      />

      <main className="flex-1 p-6 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Row 1: search + selects */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, servicio o profesional..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-37.5">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                    <SelectItem value="COMPLETED">Completada</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    <SelectItem value="NO_SHOW">No asistio</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-37.5">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: date filter */}
            <div className="flex flex-wrap items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
              {(["all", "today", "week", "month", "custom"] as DatePreset[]).map((preset) => {
                const labels: Record<DatePreset, string> = {
                  all: "Todas las fechas",
                  today: "Hoy",
                  week: "Esta semana",
                  month: "Este mes",
                  custom: "Personalizado",
                }
                return (
                  <Button
                    key={preset}
                    variant={datePreset === preset ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDatePreset(preset)}
                  >
                    {labels[preset]}
                  </Button>
                )
              })}
              {datePreset === "custom" && (
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-7 text-xs w-36"
                  />
                  <span className="text-muted-foreground text-xs">—</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-7 text-xs w-36"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead >Cliente</TableHead>
                  <TableHead >Servicio</TableHead>
                  <TableHead >Profesional</TableHead>
                  <TableHead >Fecha y hora</TableHead>
                  <TableHead >Duracion</TableHead>
                  <TableHead >Estado</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                        <Calendar className="h-12 w-12 mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron citas</p>
                        <p className="text-xs mt-1">Prueba cambiando los filtros o crea una nueva cita</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(appointment.customerName || '?').split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{appointment.customerName}</p>
                            <p className="text-xs text-muted-foreground">{appointment.customerPhone}</p>
                          </div>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: getCategoryColor(appointment.categoryId) }}
                          />
                          <span className="text-sm">{appointment.serviceName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{appointment.professionalName}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(appointment.startAt), "d MMM yyyy", { locale: es })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(appointment.startAt), "HH:mm")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{appointment.durationMin} min</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedAppointment(appointment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setAppointmentToEdit(appointment); setEditModalOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar / Reagendar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Enviar mensaje
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {appointment.status === "PENDING" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleStatusChange(appointment.id, "CONFIRMED")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                              <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() => handleStatusChange(appointment.id, "COMPLETED")}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marcar completada
                              </DropdownMenuItem>
                            )}
                            {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => { setCancelingAppointment(appointment); setCancelReason("") }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            {appointment.status === "PENDING" && (
                              <DropdownMenuItem
                                className="text-muted-foreground"
                                onClick={() => handleStatusChange(appointment.id, "NO_SHOW")}
                              >
                                <User className="mr-2 h-4 w-4" />
                                No asistio
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeletingAppointment(appointment)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <DataPagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </main>

      {/* Appointment Detail Sheet */}
      <Sheet open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle de cita</SheetTitle>
          </SheetHeader>
          {selectedAppointment && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {(selectedAppointment.customerName || '?').split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base">{selectedAppointment.customerName}</h3>
                  <StatusBadge status={selectedAppointment.status} />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(selectedAppointment.categoryId) }}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Servicio</p>
                    <p className="font-medium">{selectedAppointment.serviceName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Profesional</p>
                    <p className="font-medium">{selectedAppointment.professionalName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha y hora</p>
                    <p className="font-medium">
                      {format(new Date(selectedAppointment.startAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedAppointment.durationMin} min</p>
                  </div>
                </div>
                {selectedAppointment.price != null && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="font-semibold">${selectedAppointment.finalPrice ?? selectedAppointment.price}</p>
                    </div>
                  </div>
                )}
                {selectedAppointment.notes && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p>{selectedAppointment.notes}</p>
                  </div>
                )}
                {selectedAppointment.cancelReason && (
                  <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                    <p className="text-xs text-red-600 mb-1">Motivo de cancelacion</p>
                    <p className="text-red-700">{selectedAppointment.cancelReason}</p>
                  </div>
                )}
              </div>

              {(selectedAppointment.status === "PENDING" || selectedAppointment.status === "CONFIRMED") && (
                <div className="flex gap-2 pt-2">
                  {selectedAppointment.status === "PENDING" && (
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleStatusChange(selectedAppointment.id, "CONFIRMED")
                        setSelectedAppointment((p: any) => ({ ...p, status: "CONFIRMED" }))
                      }}
                      disabled={actioning}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-orange-600"
                    onClick={() => {
                      setCancelingAppointment(selectedAppointment)
                      setCancelReason("")
                      setSelectedAppointment(null)
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelingAppointment}
        onOpenChange={(open) => { if (!open) { setCancelingAppointment(null); setCancelReason("") } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cita de{" "}
            <span className="font-medium text-foreground">{cancelingAppointment?.customerName}</span>
            {" "}— {cancelingAppointment?.serviceName}
          </p>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Motivo de cancelacion (opcional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Ej: Cliente no confirmo, reagendo para otra fecha..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelingAppointment(null)}>Volver</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actioning}>
              {actioning ? "Cancelando..." : "Confirmar cancelacion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingAppointment}
        onOpenChange={(open) => { if (!open) setDeletingAppointment(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cita</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que queres eliminar la cita de{" "}
            <span className="font-medium text-foreground">{deletingAppointment?.customerName}</span>?
            Esta accion no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAppointment(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actioning}>
              {actioning ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewAppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        onSuccess={(apt) => {
          setAppointments((prev) => [apt, ...prev].slice(0, PAGE_SIZE))
          setTotal((t) => t + 1)
        }}
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
