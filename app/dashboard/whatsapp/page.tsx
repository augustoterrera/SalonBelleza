"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  MessageSquare,
  Phone,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Send,
  Users,
} from "lucide-react"

export default function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState("+34 612 345 678")
  const [businessName, setBusinessName] = useState("Beauty Salon")

  return (
    <>
      <Header 
        title="WhatsApp" 
        subtitle="Configura la integracion con WhatsApp Business"
        showNewAppointment={false}
      />
      
      <main className="flex-1 p-6 space-y-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  isConnected ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <MessageSquare className={`h-6 w-6 ${
                    isConnected ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    WhatsApp Business
                    <Badge 
                      variant={isConnected ? "default" : "destructive"}
                      className={isConnected ? "bg-green-600" : ""}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Desconectado
                        </>
                      )}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {isConnected 
                      ? "Tu cuenta de WhatsApp Business esta conectada y lista para enviar mensajes"
                      : "Conecta tu cuenta de WhatsApp Business para enviar mensajes automaticos"
                    }
                  </CardDescription>
                </div>
              </div>
              <Button variant={isConnected ? "outline" : "default"}>
                {isConnected ? "Desconectar" : "Conectar"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuracion de cuenta</CardTitle>
              <CardDescription>
                Informacion de tu cuenta de WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Numero de telefono</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business">Nombre del negocio</Label>
                <Input
                  id="business"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <Button className="w-full">Guardar cambios</Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadisticas de mensajes</CardTitle>
              <CardDescription>
                Resumen de actividad de los ultimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">156</p>
                  <p className="text-sm text-muted-foreground">Mensajes enviados</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">142</p>
                  <p className="text-sm text-muted-foreground">Entregados</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">98</p>
                  <p className="text-sm text-muted-foreground">Leidos</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">45</p>
                  <p className="text-sm text-muted-foreground">Respuestas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Plantillas de mensajes</CardTitle>
                <CardDescription>
                  Mensajes rapidos para enviar a los clientes
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Gestionar en n8n
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Confirmacion de cita</p>
                    <p className="text-xs text-muted-foreground">Automatico al crear cita</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Recordatorio 24h</p>
                    <p className="text-xs text-muted-foreground">24 horas antes de la cita</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Recordatorio 2h</p>
                    <p className="text-xs text-muted-foreground">2 horas antes de la cita</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Mensaje post-visita</p>
                    <p className="text-xs text-muted-foreground">Despues de completar la cita</p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
