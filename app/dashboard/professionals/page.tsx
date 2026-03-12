"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Plus, MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  toggleProfessionalActive,
} from "@/lib/actions/professionals"
import { getCategories } from "@/lib/actions/categories"
import { getServices } from "@/lib/actions/services"

const colorOptions = [
  '#0F7A61', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F97316',
]

export default function ProfessionalsPage() {
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<any | null>(null)
  const [deletingProfessional, setDeletingProfessional] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formColor, setFormColor] = useState(colorOptions[0])

  useEffect(() => {
    getProfessionals().then(setProfessionals)
    getCategories().then(setCategories)
    getServices().then(setServices)
  }, [])

  const getProfessionalServices = (professional: any) =>
    services.filter((s: any) => (professional.serviceIds || []).includes(s.id))

  const resetForm = () => {
    setFormName("")
    setFormPhone("")
    setFormEmail("")
    setFormCategoryId("")
    setFormColor(colorOptions[0])
  }

  const openNew = () => {
    setEditingProfessional(null)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (professional: any) => {
    setEditingProfessional(professional)
    setFormName(professional.name)
    setFormPhone(professional.phone || "")
    setFormEmail(professional.email || "")
    setFormCategoryId(professional.categoryId || "")
    setFormColor(professional.color || colorOptions[0])
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingProfessional) {
        const updated = await updateProfessional(editingProfessional.id, {
          name: formName,
          phone: formPhone || undefined,
          email: formEmail || undefined,
          categoryId: formCategoryId || undefined,
          color: formColor,
        } as any)
        if (updated) {
          setProfessionals((prev) =>
            prev.map((p) => (p.id === editingProfessional.id ? { ...p, ...updated } : p))
          )
          toast({ title: "Profesional actualizado" })
        } else {
          toast({ title: "Error al actualizar", variant: "destructive" })
        }
      } else {
        const created = await createProfessional({
          name: formName,
          phone: formPhone || undefined,
          email: formEmail || undefined,
          categoryId: formCategoryId || undefined,
        })
        setProfessionals((prev) => [...prev, { ...created, color: formColor }])
        toast({ title: "Profesional creado" })
      }
      setModalOpen(false)
      resetForm()
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (professional: any) => {
    const ok = await toggleProfessionalActive(professional.id)
    if (ok) {
      setProfessionals((prev) =>
        prev.map((p) => (p.id === professional.id ? { ...p, isActive: !p.isActive } : p))
      )
    }
  }

  const handleDelete = async () => {
    if (!deletingProfessional) return
    setDeleting(true)
    try {
      const ok = await deleteProfessional(deletingProfessional.id)
      if (ok) {
        setProfessionals((prev) => prev.filter((p) => p.id !== deletingProfessional.id))
        toast({ title: "Profesional eliminado" })
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
      setDeletingProfessional(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header
        title="Profesionales"
        subtitle={`${professionals.length} profesionales`}
        showNewAppointment={false}
      />

      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo profesional
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional: any) => {
            const category = categories.find((c: any) => c.id === professional.categoryId)
            const profServices = getProfessionalServices(professional)
            const accentColor = professional.color || category?.color || '#94a3b8'

            return (
              <Card key={professional.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-2" style={{ backgroundColor: accentColor }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback
                            className="text-white text-sm font-semibold"
                            style={{ backgroundColor: accentColor }}
                          >
                            {professional.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{professional.name}</h3>
                          {category && (
                            <Badge
                              variant="secondary"
                              className="mt-1 text-xs"
                              style={{
                                backgroundColor: `${category.color}20`,
                                color: category.color,
                              }}
                            >
                              {category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/appointments?professional=${professional.id}`}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Ver agenda
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(professional)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingProfessional(professional)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Citas hoy</span>
                        <span className="font-medium">{professional.todayAppointments || 0}</span>
                      </div>

                      {profServices.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Servicios</p>
                          <div className="flex flex-wrap gap-1">
                            {profServices.slice(0, 3).map((service: any) => (
                              <Badge key={service.id} variant="outline" className="text-xs">
                                {service.name}
                              </Badge>
                            ))}
                            {profServices.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profServices.length - 3} mas
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-muted-foreground">
                          {professional.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        <Switch
                          checked={professional.isActive}
                          onCheckedChange={() => handleToggleActive(professional)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Card className="border-dashed">
            <CardContent className="p-0">
              <button
                onClick={openNew}
                className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium">Agregar profesional</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) { resetForm(); setEditingProfessional(null) }
          setModalOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? "Editar profesional" : "Nuevo profesional"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Nombre del profesional"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  placeholder="+54 9 11 1234-5678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
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
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingProfessional ? "Guardar cambios" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingProfessional}
        onOpenChange={(open) => { if (!open) setDeletingProfessional(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar profesional</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que querés eliminar a{" "}
            <span className="font-medium text-foreground">{deletingProfessional?.name}</span>?
            Esta acción eliminará también su historial de citas y no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProfessional(null)}>
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
