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
  UserPlus,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getClients, createClient } from "@/lib/actions/clients"
import { getServices } from "@/lib/actions/services"
import { getProfessionals } from "@/lib/actions/professionals"
import { getCategories } from "@/lib/actions/categories"
import { createAppointment } from "@/lib/actions/appointments"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface NewAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedDate?: Date
  preselectedTime?: string
  onSuccess?: (appointment: any) => void
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  preselectedDate,
  preselectedTime,
  onSuccess,
}: NewAppointmentModalProps) {
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [date, setDate] = useState<Date | undefined>(preselectedDate)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedProfessional, setSelectedProfessional] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>(preselectedTime || "")
  const [customDuration, setCustomDuration] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [savingNewClient, setSavingNewClient] = useState(false)
  const { toast } = useToast()

  // Fetch data every time the modal opens
  useEffect(() => {
    if (!open) return
    getClients().then(setClients)
    getServices().then(setServices)
    getProfessionals().then(setProfessionals)
    getCategories().then(setCategories)
  }, [open])

  // Update when preselected values change
  useEffect(() => {
    if (preselectedDate) setDate(preselectedDate)
    if (preselectedTime) setSelectedTime(preselectedTime)
  }, [preselectedDate, preselectedTime])

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
        (c.phone || '').includes(clientSearch)
      )
    : clients

  const selectedServiceData = services.find((s: any) => s.id === selectedService)
  const selectedClientData = clients.find((c: any) => c.id === selectedClient)
  const selectedProfessionalData = professionals.find((p: any) => p.id === selectedProfessional)

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30"
  ]

  const handleSaveNewClient = async () => {
    if (!newClientName || !newClientPhone) return
    setSavingNewClient(true)
    try {
      const created = await createClient({ name: newClientName, phone: newClientPhone })
      if ("error" in created) return
      setClients((prev) => [...prev, created])
      setSelectedClient(created.id)
      setShowNewClientForm(false)
      setNewClientName("")
      setNewClientPhone("")
    } finally {
      setSavingNewClient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !date) return
    setSaving(true)
    try {
      const serviceData = services.find((s: any) => s.id === selectedService)
      const appointment = await createAppointment({
        customerId: selectedClient,
        professionalId: selectedProfessional,
        serviceId: selectedService,
        categoryId: serviceData?.categoryId ?? "",
        date: format(date, "yyyy-MM-dd"),
        time: selectedTime,
        durationMin: actualDuration,
        price: serviceData?.price,
        notes: notes || undefined,
        source: "PANEL",
      })
      if ("error" in appointment) {
        toast({ title: "Error al crear la cita", variant: "destructive" })
        return
      }
      toast({ title: "Cita creada" })
      onSuccess?.(appointment)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setDate(undefined)
    setSelectedCategory("")
    setSelectedService("")
    setSelectedProfessional("")
    setSelectedClient("")
    setSelectedTime("")
    setCustomDuration(null)
    setNotes("")
    setClientSearch("")
    setShowNewClientForm(false)
    setNewClientName("")
    setNewClientPhone("")
  }

  // Get actual duration (custom or service default)
  const actualDuration = customDuration ?? selectedServiceData?.duration ?? 0

  // Duration options in minutes
  const durationOptions = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180]

  const isFormValid = selectedClient && selectedService && selectedProfessional && date && selectedTime

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || "#0F7A61"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Nueva cita
          </DialogTitle>
          <DialogDescription>
            Completa los datos para agendar una nueva cita
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Cliente
            </Label>
            
            {!showNewClientForm ? (
              <>
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
                          {selectedClientData.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedClientData.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedClientData.phone}</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedClient("")}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                    {filteredClients.slice(0, 6).map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedClient(client.id)
                          setClientSearch("")
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-left transition-colors hover:bg-muted/50",
                          selectedClient === client.id && "border-primary bg-primary/5"
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {client.name.split(' ').map((n: string) => n[0]).join('')}
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
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowNewClientForm(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Nuevo cliente
                </Button>
              </>
            ) : (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <Input
                  placeholder="Nombre completo"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  placeholder="Telefono (ej: +34 612 345 678)"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowNewClientForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newClientName || !newClientPhone || savingNewClient}
                    onClick={handleSaveNewClient}
                  >
                    {savingNewClient ? "Guardando..." : "Guardar cliente"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              Servicio
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value)
                  setSelectedService("")
                  setSelectedProfessional("")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Select value={selectedService} onValueChange={(value) => {
                  setSelectedService(value)
                  setSelectedProfessional("")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedServiceData && (
              <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: getCategoryColor(selectedServiceData.categoryId) }}
                />
                <div className="flex-1">
                  <p className="font-medium">{selectedServiceData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Duracion sugerida: {selectedServiceData.duration} min
                  </p>
                </div>
                <Badge variant="secondary" className="text-primary font-semibold">
                  ${selectedServiceData.price}
                </Badge>
              </div>
            )}

            {/* Custom Duration */}
            {selectedService && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Duracion de la cita
                </Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((duration) => {
                    const isSelected = customDuration === duration || 
                      (customDuration === null && selectedServiceData?.duration === duration)
                    const isDefault = selectedServiceData?.duration === duration
                    return (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setCustomDuration(duration === selectedServiceData?.duration ? null : duration)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background hover:bg-muted/50 border-input"
                        )}
                      >
                        {duration >= 60 
                          ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
                          : `${duration} min`
                        }
                        {isDefault && !isSelected && (
                          <span className="ml-1 text-xs text-muted-foreground">(sugerido)</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Duracion personalizada"
                    min={5}
                    max={480}
                    step={5}
                    value={customDuration ?? ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (val > 0) setCustomDuration(val)
                      else setCustomDuration(null)
                    }}
                    className="w-40"
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                  {customDuration && customDuration !== selectedServiceData?.duration && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomDuration(null)}
                      className="text-xs"
                    >
                      Restaurar sugerido
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Professional Selection */}
          <div className="space-y-3">
            <Label>Profesional</Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredProfessionals.map((professional) => {
                const category = categories.find(c => c.id === professional.categoryId)
                return (
                  <button
                    key={professional.id}
                    type="button"
                    onClick={() => setSelectedProfessional(professional.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors hover:bg-muted/50",
                      selectedProfessional === professional.id && "border-primary bg-primary/5"
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback 
                        style={{ 
                          backgroundColor: category?.color || "#0F7A61",
                          color: "white"
                        }}
                      >
                        {professional.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{professional.name.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground">{category?.name}</p>
                    </div>
                    {selectedProfessional === professional.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Fecha y hora
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
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
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregar notas o instrucciones especiales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Summary */}
          {isFormValid && (
            <div className="p-4 rounded-lg border bg-primary/5 border-primary/20 space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Resumen de la cita
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="font-medium">{selectedClientData?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Servicio: </span>
                  <span className="font-medium">{selectedServiceData?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Profesional: </span>
                  <span className="font-medium">{selectedProfessionalData?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duracion: </span>
                  <span className="font-medium">
                    {actualDuration >= 60 
                      ? `${Math.floor(actualDuration / 60)}h${actualDuration % 60 > 0 ? ` ${actualDuration % 60}m` : ''}`
                      : `${actualDuration} min`
                    }
                    {customDuration && customDuration !== selectedServiceData?.duration && (
                      <span className="text-orange-600 ml-1">(modificado)</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold text-primary">${selectedServiceData?.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid || saving}>
              {saving ? "Guardando..." : "Crear cita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
