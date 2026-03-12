"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Tag, Loader2, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
} from "@/lib/actions/promotions"
import { getAllServices } from "@/lib/actions/services"
import { getAllProducts } from "@/lib/actions/products"

function getPromotionStatus(promo: any): "vigente" | "vencida" | "futura" {
  const now = new Date()
  const start = new Date(promo.startsAt)
  const end = new Date(promo.endsAt)
  if (isBefore(now, start)) return "futura"
  if (isAfter(now, end)) return "vencida"
  return "vigente"
}

export default function PromotionsPage() {
  const { toast } = useToast()

  const [promotions, setPromotions] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<any | null>(null)
  const [deletingPromo, setDeletingPromo] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDiscount, setFormDiscount] = useState("")
  const [formStartsAt, setFormStartsAt] = useState("")
  const [formEndsAt, setFormEndsAt] = useState("")
  const [formServiceId, setFormServiceId] = useState("")
  const [formProductId, setFormProductId] = useState("")

  useEffect(() => {
    Promise.all([getPromotions(), getAllServices(), getAllProducts()]).then(
      ([promos, svcs, prods]) => {
        setPromotions(promos)
        setServices(svcs)
        setProducts(prods)
        setLoading(false)
      }
    )
  }, [])

  const filtered = promotions.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (statusFilter === "all") return true
    return getPromotionStatus(p) === statusFilter
  })

  const resetForm = () => {
    setFormTitle("")
    setFormDescription("")
    setFormDiscount("")
    setFormStartsAt("")
    setFormEndsAt("")
    setFormServiceId("")
    setFormProductId("")
  }

  const openNew = () => {
    setEditingPromo(null)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (promo: any) => {
    setEditingPromo(promo)
    setFormTitle(promo.title)
    setFormDescription(promo.description || "")
    setFormDiscount(promo.discount != null ? String(promo.discount) : "")
    setFormStartsAt(format(new Date(promo.startsAt), "yyyy-MM-dd"))
    setFormEndsAt(format(new Date(promo.endsAt), "yyyy-MM-dd"))
    setFormServiceId(promo.serviceId || "")
    setFormProductId(promo.productId || "")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        title: formTitle,
        description: formDescription || undefined,
        discount: formDiscount ? parseFloat(formDiscount) : undefined,
        startsAt: formStartsAt,
        endsAt: formEndsAt,
        serviceId: formServiceId || undefined,
        productId: formProductId || undefined,
      }

      if (editingPromo) {
        const updated = await updatePromotion(editingPromo.id, data)
        if (updated && !("error" in updated)) {
          setPromotions((prev) => prev.map((p) => (p.id === editingPromo.id ? updated : p)))
          toast({ title: "Promocion actualizada" })
        } else {
          toast({ title: (updated as any)?.error ?? "Error al actualizar", variant: "destructive" })
        }
      } else {
        const created = await createPromotion(data)
        if ("error" in created) {
          toast({ title: created.error, variant: "destructive" })
        } else {
          setPromotions((prev) => [created, ...prev])
          toast({ title: "Promocion creada" })
        }
      }
      setModalOpen(false)
      resetForm()
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (promo: any) => {
    const ok = await togglePromotionActive(promo.id)
    if (ok) {
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: !p.isActive } : p))
      )
    }
  }

  const handleDelete = async () => {
    if (!deletingPromo) return
    setDeleting(true)
    try {
      const ok = await deletePromotion(deletingPromo.id)
      if (ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== deletingPromo.id))
        toast({ title: "Promocion eliminada" })
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
      setDeletingPromo(null)
    } finally {
      setDeleting(false)
    }
  }

  const statusBadge = (promo: any) => {
    const s = getPromotionStatus(promo)
    if (!promo.isActive)
      return <Badge variant="secondary">Inactiva</Badge>
    if (s === "vigente")
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Vigente</Badge>
    if (s === "futura")
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Futura</Badge>
    return <Badge variant="secondary">Vencida</Badge>
  }

  return (
    <>
      <Header
        title="Promociones"
        subtitle={`${promotions.length} promociones`}
        showNewAppointment={false}
      />

      <main className="flex-1 p-6">
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar promociones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="vigente">Vigentes</SelectItem>
                    <SelectItem value="futura">Futuras</SelectItem>
                    <SelectItem value="vencida">Vencidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva promocion
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead >Promocion</TableHead>
                  <TableHead >Aplica a</TableHead>
                  <TableHead >Descuento</TableHead>
                  <TableHead >Vigencia</TableHead>
                  <TableHead >Estado</TableHead>
                  <TableHead >Activa</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                        <Tag className="h-12 w-12 mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron promociones</p>
                        <p className="text-xs mt-1">Crea una promocion para atraer mas clientes</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((promo) => (
                    <TableRow key={promo.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <Tag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{promo.title}</span>
                            {promo.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-56">
                                {promo.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {promo.serviceName ? (
                          <Badge variant="outline" className="text-xs">
                            Servicio: {promo.serviceName}
                          </Badge>
                        ) : promo.productName ? (
                          <Badge variant="outline" className="text-xs">
                            Producto: {promo.productName}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">General</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.discount != null ? (
                          <span className="text-sm font-medium">
                            ${promo.discount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(promo.startsAt), "dd/MM/yy", { locale: es })} –{" "}
                          {format(new Date(promo.endsAt), "dd/MM/yy", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(promo)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={promo.isActive}
                          onCheckedChange={() => handleToggleActive(promo)}
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
                            <DropdownMenuItem onClick={() => openEdit(promo)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeletingPromo(promo)}
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
          </CardContent>
        </Card>
      </main>

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) { resetForm(); setEditingPromo(null) }
          setModalOpen(open)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? "Editar promocion" : "Nueva promocion"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input
                id="title"
                placeholder="Ej: 20% off en corte de cabello"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Detalle de la promocion..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Descuento en $ (opcional)</Label>
              <Input
                id="discount"
                type="number"
                placeholder="500"
                min={0}
                step={0.01}
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Fecha inicio</Label>
                <Input
                  id="startsAt"
                  type="date"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">Fecha vencimiento</Label>
                <Input
                  id="endsAt"
                  type="date"
                  value={formEndsAt}
                  onChange={(e) => setFormEndsAt(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Aplicar a servicio (opcional)</Label>
              <Select value={formServiceId} onValueChange={(v) => { setFormServiceId(v); setFormProductId("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aplicar a producto (opcional)</Label>
              <Select value={formProductId} onValueChange={(v) => { setFormProductId(v); setFormServiceId("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingPromo ? "Guardar cambios" : "Crear promocion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingPromo}
        onOpenChange={(open) => { if (!open) setDeletingPromo(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar promocion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que queres eliminar{" "}
            <span className="font-medium text-foreground">{deletingPromo?.title}</span>?
            Esta accion no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPromo(null)}>
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
