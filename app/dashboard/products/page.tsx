"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DataPagination } from "@/components/ui/data-pagination"
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Package, DollarSign, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getProductsPaginated,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from "@/lib/actions/products"

const PAGE_SIZE = 20

export default function ProductsPage() {
  const { toast } = useToast()

  // Data + pagination
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formImageUrl, setFormImageUrl] = useState("")

  // Debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [searchQuery])

  // Reset page on status filter change
  useEffect(() => { setPage(1) }, [statusFilter])

  // Fetch page
  useEffect(() => {
    setLoading(true)
    getProductsPaginated({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
    })
      .then(({ data, total }) => { setProducts(data); setTotal(total) })
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, statusFilter])

  const resetForm = () => {
    setFormName(""); setFormDescription(""); setFormPrice(""); setFormImageUrl("")
  }

  const openNew = () => { setEditingProduct(null); resetForm(); setModalOpen(true) }

  const openEdit = (product: any) => {
    setEditingProduct(product)
    setFormName(product.name)
    setFormDescription(product.description || "")
    setFormPrice(String(product.price))
    setFormImageUrl(product.imageUrl || "")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        name: formName,
        description: formDescription || undefined,
        price: parseFloat(formPrice),
        imageUrl: formImageUrl || undefined,
      }

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, data)
        if (updated && !("error" in updated)) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)))
          toast({ title: "Producto actualizado" })
        } else {
          toast({ title: (updated as any)?.error ?? "Error al actualizar", variant: "destructive" })
        }
      } else {
        const created = await createProduct(data)
        if ("error" in created) {
          toast({ title: created.error, variant: "destructive" })
        } else {
          setTotal((t) => t + 1)
          if (page === 1) setProducts((prev) => [created, ...prev].slice(0, PAGE_SIZE))
          toast({ title: "Producto creado" })
        }
      }
      setModalOpen(false); resetForm()
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (product: any) => {
    const ok = await toggleProductActive(product.id)
    if (ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
      )
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      const ok = await deleteProduct(deletingProduct.id)
      if (ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id))
        setTotal((t) => t - 1)
        toast({ title: "Producto eliminado" })
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
      setDeletingProduct(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header
        title="Productos"
        subtitle={`${total} productos en total`}
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
                    placeholder="Buscar productos..."
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
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Solo activos</SelectItem>
                    <SelectItem value="inactive">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo producto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead >Producto</TableHead>
                  <TableHead >Precio</TableHead>
                  <TableHead >Activo</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                        <Package className="h-12 w-12 mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron productos</p>
                        <p className="text-xs mt-1">Agrega productos para vender en el salon</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{product.name}</span>
                            {product.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-64">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          {product.price.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={() => handleToggleActive(product)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {product.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeletingProduct(product)}
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

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) { resetForm(); setEditingProduct(null) }
          setModalOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del producto</Label>
              <Input
                id="name"
                placeholder="Ej: Shampoo profesional"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descripcion breve del producto..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
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
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://..."
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingProduct}
        onOpenChange={(open) => { if (!open) setDeletingProduct(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que queres eliminar{" "}
            <span className="font-medium text-foreground">{deletingProduct?.name}</span>?
            Esta accion no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
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
