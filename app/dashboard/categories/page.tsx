"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Scissors,
  Hand,
  Sparkles,
  Star,
  Palette,
  Wand2,
  Sun,
  Moon,
  Flower2,
  Heart,
  Eye,
  Smile,
  Droplets,
  Flame,
  Wind,
  Zap,
  Crown,
  Feather,
  Leaf,
  Shell,
  Gem,
  Brush,
} from "lucide-react"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories"
import { useToast } from "@/hooks/use-toast"

const iconOptions = [
  { value: 'scissors',  icon: Scissors,  label: 'Tijeras' },
  { value: 'wand2',     icon: Wand2,     label: 'Varita' },
  { value: 'wind',      icon: Wind,      label: 'Secado' },
  { value: 'hand',      icon: Hand,      label: 'Mano' },
  { value: 'sparkles',  icon: Sparkles,  label: 'Brillos' },
  { value: 'palette',   icon: Palette,   label: 'Paleta' },
  { value: 'brush',     icon: Brush,     label: 'Pincel' },
  { value: 'eye',       icon: Eye,       label: 'Ojos' },
  { value: 'smile',     icon: Smile,     label: 'Facial' },
  { value: 'heart',     icon: Heart,     label: 'Corazon' },
  { value: 'droplets',  icon: Droplets,  label: 'Hidratacion' },
  { value: 'sun',       icon: Sun,       label: 'Solar' },
  { value: 'moon',      icon: Moon,      label: 'Nocturno' },
  { value: 'flame',     icon: Flame,     label: 'Keratina' },
  { value: 'zap',       icon: Zap,       label: 'Laser' },
  { value: 'flower2',   icon: Flower2,   label: 'Flor' },
  { value: 'leaf',      icon: Leaf,      label: 'Natural' },
  { value: 'feather',   icon: Feather,   label: 'Suave' },
  { value: 'shell',     icon: Shell,     label: 'Spa' },
  { value: 'gem',       icon: Gem,       label: 'Premium' },
  { value: 'crown',     icon: Crown,     label: 'VIP' },
  { value: 'star',      icon: Star,      label: 'Estrella' },
]

const colorOptions = [
  '#0F7A61', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F97316',
  '#06B6D4', '#84CC16', '#E11D48', '#7C3AED',
]

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState(colorOptions[0])
  const [formIcon, setFormIcon] = useState(iconOptions[0].value)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormColor(colorOptions[0])
    setFormIcon(iconOptions[0].value)
  }

  const openNew = () => {
    setEditingCategory(null)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (category: any) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormDescription(category.description || "")
    setFormColor(category.color || colorOptions[0])
    setFormIcon(category.icon || iconOptions[0].value)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, {
          name: formName,
          color: formColor,
          icon: formIcon,
          description: formDescription || undefined,
        })
        if (updated) {
          setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c)))
          toast({ title: "Categoria actualizada" })
        } else {
          toast({ title: "Error al actualizar", variant: "destructive" })
        }
      } else {
        const created = await createCategory({
          name: formName,
          color: formColor,
          icon: formIcon,
          description: formDescription || undefined,
        })
        setCategories((prev) => [...prev, created])
        toast({ title: "Categoria creada" })
      }
      setModalOpen(false)
      resetForm()
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setDeleting(true)
    try {
      const ok = await deleteCategory(deletingCategory.id)
      if (ok) {
        setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id))
        toast({ title: "Categoria eliminada" })
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
      setDeletingCategory(null)
    } finally {
      setDeleting(false)
    }
  }

  const getIconComponent = (iconName?: string) => {
    return iconOptions.find(i => i.value === iconName)?.icon || Scissors
  }

  return (
    <>
      <Header
        title="Categorias"
        subtitle={`${categories.length} categorias de servicios`}
        showNewAppointment={false}
      />

      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva categoria
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category: any) => {
            const IconComponent = getIconComponent(category.icon)

            return (
              <Card key={category.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="h-20 flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Badge variant="secondary" className="text-xs">
                        {category.servicesCount || 0} servicios
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {category.professionalsCount || 0} profesionales
                      </Badge>
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
                className="flex flex-col items-center justify-center w-full h-full min-h-[180px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium">Nueva categoria</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) { resetForm(); setEditingCategory(null) }
          setModalOpen(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre de la categoria"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Input
                id="description"
                placeholder="Descripcion breve"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: formColor }}
              >
                {(() => {
                  const Icon = getIconComponent(formIcon)
                  return <Icon className="h-6 w-6 text-white" />
                })()}
              </div>
              <div>
                <p className="font-medium text-sm">{formName || "Vista previa"}</p>
                <p className="text-xs text-muted-foreground">{formDescription || "Descripcion"}</p>
              </div>
            </div>

            {/* Icon picker */}
            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {iconOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    onClick={() => setFormIcon(value)}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                      formIcon === value
                        ? 'ring-2 ring-primary bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
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
                {saving ? "Guardando..." : editingCategory ? "Guardar cambios" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => { if (!open) setDeletingCategory(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoria</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que querés eliminar{" "}
            <span className="font-medium text-foreground">{deletingCategory?.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
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
