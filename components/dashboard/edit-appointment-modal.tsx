"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  Search,
  Pencil,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getClients } from "@/lib/actions/clients"
import { getServices } from "@/lib/actions/services"
import { getProfessionals } from "@/lib/actions/professionals"
import { getCategories } from "@/lib/actions/categories"
import { updateAppointment } from "@/lib/actions/appointments"
import type { AppointmentWithRelations } from "@/lib/actions/appointments"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface EditAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentWithRelations | null
  onSuccess?: (appointment: any) => void
}

export function EditAppointmentModal({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: EditAppointmentModalProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [date, setDate] = useState<Date | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedProfessional, setSelectedProfessional] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [customDuration, setCustomDuration] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [saving, setSaving] = useState(false)

  // Load data and pre-fill when modal opens
  useEffect(() => {
    if (!open || !appointment) return
    Promise.all([
      getClients(),
      getServices(),
      getProfessionals(),
      getCategories(),
    ]).then(([c, s, p, cat]) => {
      setClients(c)
      setServices(s)
      setProfessionals(p)
      setCategories(cat)

      // Pre-fill form from appointment
      setSelectedClient(appointment.customerId)
      setSelectedService(appointment.serviceId)
      setSelectedCategory(appointment.categoryId ?? "")
      setSelectedProfessional(appointment.professionalId)
      setDate(new Date(appointment.startAt))
      setSelectedTime(format(new Date(appointment.startAt), "HH:mm"))
      setCustomDuration(appointment.durationMin)
      setNotes(appointment.notes ?? "")
    })
  }, [open, appointment])

  const filteredServices = selectedCategory
    ? services.filter((s: any) => s.categoryId === selectedCategory)
    : services

  const filteredProfessionals = (() => {
    if (!selectedService) return professionals
    const service = services.find((s: any) => s.id === selectedService)
    const ids: string[] = service?.professionalIds ?? []
    if (ids.length === 0) return professionals
    return professionals.filter((p: any) => ids.includes(p.id))
  })()

  const filteredClients = clientSearch
    ? clients.filter((c: any) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.phone || "").includes(clientSearch)
      )
    : clients

  const selectedServiceData = services.find((s: any) => s.id === selectedService)
  const selectedClientData = clients.find((c: any) => c.id === selectedClient)
  const selectedProfessionalData = professionals.find((p: any) => p.id === selectedProfessional)

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30",
  ]

  const actualDuration = customDuration ?? selectedServiceData?.duration ?? 0
  const durationOptions = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180]

  const isFormValid = selectedClient && selectedService && selectedProfessional && date && selectedTime

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color || "#0F7A61"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !date || !appointment) return
    setSaving(true)
    try {
      const serviceData = services.find((s: any) => s.id === selectedService)
      const result = await updateAppointment(appointment.id, {
        customerId: selectedClient,
        professionalId: selectedProfessional,
        serviceId: selectedService,
        categoryId: serviceData?.categoryId ?? appointment.categoryId,
        date: format(date, "yyyy-MM-dd"),
        time: selectedTime,
        durationMin: actualDuration,
        price: serviceData?.price,
        notes: notes || undefined,
      })
      if (!result) {
        toast({ title: "Error al guardar", variant: "destructive" })
        return
      }
      toast({ title: "Cita actualizada" })
      onSuccess?.(result)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar cita
          </DialogTitle>
          <DialogDescription>
            Modificá los datos de la cita
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Cliente
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o telefono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {selectedClient && selectedClientData ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedClientData.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedClientData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedClientData.phone}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedClient("")}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                {filteredClients.slice(0, 6).map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => { setSelectedClient(client.id); setClientSearch("") }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-left transition-colors hover:bg-muted/50",
                      selectedClient === client.id && "border-primary bg-primary/5"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {client.name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              Servicio
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedService(""); setSelectedProfessional("") }}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
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
              <Select value={selectedService} onValueChange={(v) => { setSelectedService(v); setSelectedProfessional("") }}>
                <SelectTrigger><SelectValue placeholder="Servicio" /></SelectTrigger>
                <SelectContent>
                  {filteredServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedServiceData && (
              <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getCategoryColor(selectedServiceData.categoryId) }} />
                <div className="flex-1">
                  <p className="font-medium">{selectedServiceData.name}</p>
                  <p className="text-sm text-muted-foreground">Duracion sugerida: {selectedServiceData.duration} min</p>
                </div>
                <Badge variant="secondary" className="text-primary font-semibold">${selectedServiceData.price}</Badge>
              </div>
            )}

            {selectedService && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Duracion
                </Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((d) => {
                    const isSelected = customDuration === d || (customDuration === null && selectedServiceData?.duration === d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCustomDuration(d === selectedServiceData?.duration && customDuration === null ? null : d)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                          isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50 border-input"
                        )}
                      >
                        {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 > 0 ? ` ${d % 60}m` : ""}` : `${d} min`}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Personalizado"
                    min={5} max={480} step={5}
                    value={customDuration ?? ""}
                    onChange={(e) => { const v = parseInt(e.target.value); setCustomDuration(v > 0 ? v : null) }}
                    className="w-40"
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>
              </div>
            )}
          </div>

          {/* Professional */}
          <div className="space-y-3">
            <Label>Profesional</Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredProfessionals.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProfessional(p.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors hover:bg-muted/50 relative",
                      selectedProfessional === p.id && "border-primary bg-primary/5"
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{ backgroundColor: cat?.color || "#0F7A61", color: "white" }}>
                        {p.name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{p.name.split(" ")[0]}</p>
                      <p className="text-xs text-muted-foreground">{cat?.name}</p>
                    </div>
                    {selectedProfessional === p.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Fecha y hora
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} locale={es} initialFocus />
                </PopoverContent>
              </Popover>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {date && selectedTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {format(date, "EEEE, d 'de' MMMM", { locale: es })} a las {selectedTime}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Notas o instrucciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid || saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
