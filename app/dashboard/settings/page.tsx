"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Bell,
  Save,
  Loader2,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react"
import { getBusinessSettings, updateBusinessSettings, getApiKey, generateApiKey } from "@/lib/actions/settings"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [salonName, setSalonName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [timezone, setTimezone] = useState("America/Buenos_Aires")
  const [currency, setCurrency] = useState("ARS")

  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [generatingKey, setGeneratingKey] = useState(false)

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [reminderNotifications, setReminderNotifications] = useState(true)

  useEffect(() => {
    Promise.all([getBusinessSettings(), getApiKey()]).then(([data, key]) => {
      if (data) {
        setSalonName(data.name)
        setAddress(data.address || "")
        setPhone(data.phone || "")
        setEmail(data.email || "")
        setTimezone(data.timezone || "America/Buenos_Aires")
        setCurrency(data.currency || "ARS")
      }
      setApiKey(key)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateBusinessSettings({
        name: salonName,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        timezone,
      })
      if (result) {
        toast({ title: "Configuracion guardada" })
      } else {
        toast({ title: "Error al guardar", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error inesperado", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header
          title="Configuracion"
          subtitle="Ajustes generales del salon"
          showNewAppointment={false}
        />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </>
    )
  }

  return (
    <>
      <Header
        title="Configuracion"
        subtitle="Ajustes generales del salon"
        showNewAppointment={false}
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Informacion del salon</CardTitle>
                <CardDescription>Datos basicos de tu negocio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salon-name">Nombre del salon</Label>
                <Input
                  id="salon-name"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Direccion</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Configuracion regional</CardTitle>
                <CardDescription>Zona horaria y moneda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Zona horaria</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Buenos_Aires">America/Buenos Aires (GMT-3)</SelectItem>
                    <SelectItem value="America/Mexico_City">America/Mexico (GMT-6)</SelectItem>
                    <SelectItem value="America/New_York">America/New York (GMT-5)</SelectItem>
                    <SelectItem value="America/Bogota">America/Bogota (GMT-5)</SelectItem>
                    <SelectItem value="America/Santiago">America/Santiago (GMT-4)</SelectItem>
                    <SelectItem value="Europe/Madrid">Europa/Madrid (GMT+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                    <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                    <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                    <SelectItem value="USD">Dolar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Configura como recibir alertas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificaciones por email</p>
                <p className="text-sm text-muted-foreground">Recibir alertas en tu correo electronico</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificaciones SMS</p>
                <p className="text-sm text-muted-foreground">Recibir alertas por mensaje de texto</p>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recordatorios de citas</p>
                <p className="text-sm text-muted-foreground">Alertas sobre citas proximas</p>
              </div>
              <Switch checked={reminderNotifications} onCheckedChange={setReminderNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* API Key */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>API Key del agente</CardTitle>
                <CardDescription>Usa esta clave para autenticar el agente de WhatsApp</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKey ? (
              <div className="space-y-2">
                <Label>Clave actual</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={showApiKey ? apiKey : "•".repeat(48)}
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(apiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay API key generada todavia.</p>
            )}
            <Button
              variant="outline"
              className="gap-2"
              disabled={generatingKey}
              onClick={async () => {
                setGeneratingKey(true)
                try {
                  const newKey = await generateApiKey()
                  setApiKey(newKey)
                  setShowApiKey(true)
                } finally {
                  setGeneratingKey(false)
                }
              }}
            >
              {generatingKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {apiKey ? "Regenerar API Key" : "Generar API Key"}
            </Button>
            {apiKey && (
              <p className="text-xs text-muted-foreground">
                Regenerar invalida la clave anterior. El agente dejara de funcionar hasta que actualices la clave en n8n.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Guardando..." : "Guardar todos los cambios"}
          </Button>
        </div>
      </main>
    </>
  )
}
