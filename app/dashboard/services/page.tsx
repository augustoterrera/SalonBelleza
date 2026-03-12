"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Sparkles,
  Clock,
  DollarSign,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
} from "@/lib/actions/services"
import { getCategories } from "@/lib/actions/categories"
import { getProfessionals } from "@/lib/actions/professionals"

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [deletingService, setDeletingService] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formDuration, setFormDuration] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formPriceIsFrom, setFormPriceIsFrom] = useState(false)

  useEffect(() => {
    getAllServices().then(setServices)
    getCategories().then(setCategories)
    getProfessionals().then(setProfessionals)
  }, [])

  const filteredServices = useMemo(() => {
    return services.filter((service: any) => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || service.categoryId === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, categoryFilter, services])

  const getServiceProfessionals = (professionalIds: string[]) =>
    professionals.filter((p: any) => professionalIds.includes(p.id))

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormCategoryId("")
    setFormDuration("")
    setFormPrice("")
    setFormPriceIsFrom(false)
  }

  const openNew = () => {
    setEditingService(null)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (service: any) => {
    setEditingService(service)
    setFormName(service.name)
    setFormDescription(service.description || "")
    setFormCategoryId(service.categoryId || "")
    setFormDuration(String(service.duration || service.durationMin || ""))
    setFormPrice(String(service.price || ""))
    setFormPriceIsFrom(service.priceIsFrom ?? false)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingService) {
        const updated = await updateService(editingService.id, {
          name: formName,
          description: formDescription || undefined,
          categoryId: formCategoryId,
          duration: parseInt(formDuration),
          price: parseFloat(formPrice),
          priceIsFrom: formPriceIsFrom,
        })
        if (updated) {
          setServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)))
          toast({ title: "Servicio actualizado" })
        } else {
          toast({ title: "Error al actualizar", variant: "destructive" })
        }
      } else {
        const created = await createService({
          name: formName,
          description: formDescription || undefined,
          categoryId: formCategoryId,
          duration: parseInt(formDuration),
          price: parseFloat(formPrice),
          priceIsFrom: formPriceIsFrom,
        })
        setServices((prev) => [...prev, created])
        toast({ title: "Servicio creado" })
      }
      setModalOpen(false)
      resetForm()
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (service: any) => {
    const ok = await toggleServiceActive(service.id)
    if (ok) {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, active: !s.active, isActive: !s.isActive } : s))
      )
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return
    setDeleting(true)
    try {
      const ok = await deleteService(deletingService.id)
      if (ok) {
        setServices((prev) => prev.filter((s) => s.id !== deletingService.id))
        toast({ title: "Servicio eliminado" })
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
      setDeletingService(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header
        title="Servicios"
        subtitle={`${services.length} servicios disponibles`}
        showNewAppointment={false}
      />

      <main className="flex-1 p-6">
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar servicios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorias</SelectItem>
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
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo servicio
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead >Servicio</TableHead>
                  <TableHead >Categoria</TableHead>
                  <TableHead >Duracion</TableHead>
                  <TableHead >Precio</TableHead>
                  <TableHead >Profesionales</TableHead>
                  <TableHead >Activo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                        <Sparkles className="h-12 w-12 mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron servicios</p>
                        <p className="text-xs mt-1">Crea tu primer servicio para empezar a tomar citas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => {
                    const category = categories.find((c) => c.id === service.categoryId)
                    const serviceProfessionals = getServiceProfessionals(service.professionalIds || [])

                    return (
                      <TableRow key={service.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${category?.color}20` }}
                            >
                              <Sparkles
                                className="h-4 w-4"
                                style={{ color: category?.color }}
                              />
                            </div>
                            <div>
                              <span className="font-medium">{service.name}</span>
                              {service.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${category?.color}20`,
                              color: category?.color,
                            }}
                          >
                            {category?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {service.duration ?? service.durationMin} min
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            {service.priceIsFrom && (
                              <span className="text-xs text-muted-foreground font-normal">desde </span>
                            )}
                            {service.price?.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {serviceProfessionals.slice(0, 3).map((prof: any) => {
                              const profColor = prof.color || categories.find((c: any) => c.id === prof.categoryId)?.color
                              return (
                                <div
                                  key={prof.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-medium text-white"
                                  style={{ backgroundColor: profColor || '#94a3b8' }}
                                  title={prof.name}
                                >
                                  {prof.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                              )
                            })}
                            {serviceProfessionals.length > 3 && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                                +{serviceProfessionals.length - 3}
                              </div>
                            )}
                            {serviceProfessionals.length === 0 && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={service.active ?? service.isActive}
                            onCheckedChange={() => handleToggleActive(service)}
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(service)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingService(service)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) { resetForm(); setEditingService(null) }
          setModalOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del servicio</Label>
              <Input
                id="name"
                placeholder="Ej: Corte de cabello"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descripcion breve del servicio..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoria" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duracion (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="45"
                  min={5}
                  step={5}
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="2500"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="priceIsFrom"
                checked={formPriceIsFrom}
                onCheckedChange={(v) => setFormPriceIsFrom(!!v)}
              />
              <Label htmlFor="priceIsFrom" className="font-normal cursor-pointer">
                Precio "a partir de" (precio variable segun el trabajo)
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formCategoryId}>
                {saving ? "Guardando..." : editingService ? "Guardar cambios" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingService}
        onOpenChange={(open) => { if (!open) setDeletingService(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar servicio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que querés eliminar{" "}
            <span className="font-medium text-foreground">{deletingService?.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingService(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
