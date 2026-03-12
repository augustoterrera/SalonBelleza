"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataPagination } from "@/components/ui/data-pagination"
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  MessageSquare,
  Edit,
  Trash2,
  Calendar,
  User,
  Clock,
  Loader2,
} from "lucide-react"
import {
  getClientsPaginated,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/actions/clients"
import { getAppointments } from "@/lib/actions/appointments"
import type { Client } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const PAGE_SIZE = 20

export default function ClientsPage() {
  const { toast } = useToast()

  // Pagination + data
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Search (debounced)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)
  const [deletingClient, setDeletingClient] = useState<any | null>(null)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [clientAppointments, setClientAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form
  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formWhatsapp, setFormWhatsapp] = useState("")
  const [formNotes, setFormNotes] = useState("")

  // Debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [searchQuery])

  // Fetch page
  useEffect(() => {
    setLoading(true)
    getClientsPaginated({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined })
      .then(({ data, total }) => {
        setClients(data)
        setTotal(total)
      })
      .finally(() => setLoading(false))
  }, [page, debouncedSearch])

  // Lazy-load appointments when sheet opens
  useEffect(() => {
    if (!selectedClient) { setClientAppointments([]); return }
    setLoadingAppointments(true)
    getAppointments({ customerId: selectedClient.id })
      .then(setClientAppointments)
      .finally(() => setLoadingAppointments(false))
  }, [selectedClient?.id])

  const resetForm = () => {
    setFormName(""); setFormPhone(""); setFormWhatsapp(""); setFormNotes("")
  }

  const openNew = () => { setEditingClient(null); resetForm(); setModalOpen(true) }

  const openEdit = (client: any) => {
    setEditingClient(client)
    setFormName(client.name)
    setFormPhone(client.phone || "")
    setFormWhatsapp(client.whatsapp || "")
    setFormNotes(client.notes || "")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, {
          name: formName, phone: formPhone, whatsapp: formWhatsapp, notes: formNotes || undefined,
        })
        if (updated && !("error" in updated)) {
          setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...updated } : c)))
          if (selectedClient?.id === editingClient.id) setSelectedClient((p: any) => ({ ...p, ...updated }))
          toast({ title: "Cliente actualizado" })
        } else {
          toast({ title: "Error al actualizar", variant: "destructive" })
        }
      } else {
        const created = await createClient({
          name: formName, phone: formPhone, whatsapp: formWhatsapp, notes: formNotes || undefined,
        })
        if (!("error" in created)) {
          setTotal((t) => t + 1)
          if (page === 1) setClients((prev) => [created, ...prev].slice(0, PAGE_SIZE))
          toast({ title: "Cliente creado" })
        } else {
          toast({ title: (created as any).error, variant: "destructive" })
        }
      }
      setModalOpen(false); resetForm()
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingClient) return
    setDeleting(true)
    try {
      const ok = await deleteClient(deletingClient.id)
      if (ok) {
        setClients((prev) => prev.filter((c) => c.id !== deletingClient.id))
        setTotal((t) => t - 1)
        if (selectedClient?.id === deletingClient.id) setSelectedClient(null)
        toast({ title: "Cliente eliminado" })
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
      setDeletingClient(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${total} clientes registrados`}
        showNewAppointment={false}
      />

      <main className="flex-1 p-6">
        <Card>
          <CardHeader className="px-4 py-4 border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, telefono o WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead >Cliente</TableHead>
                  <TableHead >Telefono</TableHead>
                  <TableHead >WhatsApp</TableHead>
                  <TableHead >Visitas</TableHead>
                  <TableHead >Total gastado</TableHead>
                  <TableHead >Registrado</TableHead>
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
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                        <User className="h-12 w-12 mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron clientes</p>
                        <p className="text-xs mt-1">Agrega tu primer cliente para comenzar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {client.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{client.name}</p>
                            {client.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-50">
                                {client.notes}
                              </p>
                            )}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{client.phone}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.whatsapp && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{client.whatsapp}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {client.totalVisits ?? 0} visitas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          ${(client.totalSpent ?? 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(client.createdAt), "d MMM yyyy", { locale: es })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                              <User className="mr-2 h-4 w-4" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Nueva cita
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Enviar WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEdit(client)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeletingClient(client)}
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
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { resetForm(); setEditingClient(null) } setModalOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Nombre del cliente"
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
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="+5491112345678"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Preferencias, alergias, observaciones..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingClient ? "Guardar cambios" : "Guardar cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingClient} onOpenChange={(open) => { if (!open) setDeletingClient(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que queres eliminar a{" "}
            <span className="font-medium text-foreground">{deletingClient?.name}</span>?
            Esta accion no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingClient(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Sheet */}
      <Sheet open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Perfil del cliente</SheetTitle>
          </SheetHeader>

          {selectedClient && (
            <div className="mt-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedClient.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente desde {format(new Date(selectedClient.createdAt), "MMMM yyyy", { locale: es })}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {selectedClient.totalVisits ?? 0} visitas
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ${(selectedClient.totalSpent ?? 0).toLocaleString()} gastados
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedClient(null); openEdit(selectedClient) }}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Editar
                </Button>
              </div>

              <div className="space-y-3">
                {selectedClient.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefono</p>
                      <p className="text-sm font-medium">{selectedClient.phone}</p>
                    </div>
                  </div>
                )}
                {selectedClient.whatsapp && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="text-sm font-medium">{selectedClient.whatsapp}</p>
                    </div>
                  </div>
                )}
                {selectedClient.notes && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm">{selectedClient.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3">Historial de citas</h4>
                {loadingAppointments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clientAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin citas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {clientAppointments.map((apt: any) => (
                      <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {apt.serviceNameSnapshot || apt.serviceName || 'Servicio'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.startAt), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          ${apt.price ?? 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <Calendar className="h-4 w-4" />
                  Nueva cita
                </Button>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
