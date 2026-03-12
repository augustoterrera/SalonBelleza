"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Zap,
  Clock,
  Bell,
  MessageSquare,
  CheckCircle,
  Edit,
} from "lucide-react"
import {
  getAutomations,
  updateAutomation,
  toggleAutomationActive,
  type Automation,
} from "@/lib/actions/settings"

const automationIcons: Record<string, typeof Bell> = {
  confirmation: CheckCircle,
  reminder: Clock,
  reminder_24h: Clock,
  reminder_2h: Bell,
  post_visit: MessageSquare,
}

const automationLabels: Record<string, string> = {
  confirmation: 'Al agendar',
  reminder: 'Recordatorio',
  reminder_24h: '24h antes',
  reminder_2h: '2h antes',
  post_visit: 'Post visita',
}

export default function AutomationsPage() {
  const [automationList, setAutomationList] = useState<Automation[]>([])
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [editMessage, setEditMessage] = useState("")

  useEffect(() => {
    getAutomations().then(setAutomationList)
  }, [])

  const handleToggle = async (id: string) => {
    await toggleAutomationActive(id)
    setAutomationList(prev =>
      prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)
    )
  }

  const openEditModal = (automation: Automation) => {
    setEditingAutomation(automation)
    setEditMessage(automation.messageTemplate)
  }

  const saveMessage = async () => {
    if (!editingAutomation) return
    await updateAutomation(editingAutomation.id, { messageTemplate: editMessage })
    setAutomationList(prev =>
      prev.map(a => a.id === editingAutomation.id ? { ...a, messageTemplate: editMessage } : a)
    )
    setEditingAutomation(null)
  }

  return (
    <>
      <Header 
        title="Automatizaciones" 
        subtitle="Configura mensajes automaticos de WhatsApp"
        showNewAppointment={false}
      />
      
      <main className="flex-1 p-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Integracion con n8n y WhatsApp</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Las automatizaciones se conectan con n8n para enviar mensajes automaticos 
                  a traves de WhatsApp Business. Configura tus flujos en n8n para activarlas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automations Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {automationList.map((automation) => {
            const IconComponent = automationIcons[automation.type] ?? Bell

            return (
              <Card key={automation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        automation.isActive ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          automation.isActive ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{automation.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {automationLabels[automation.type] ?? automation.type}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={() => handleToggle(automation.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-lg bg-muted/50 p-3 mb-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {automation.messageTemplate}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{cliente}'}, {'{fecha}'}, {'{hora}'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => openEditModal(automation)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      {/* Edit Message Modal */}
      <Dialog open={!!editingAutomation} onOpenChange={() => setEditingAutomation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mensaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mensaje</Label>
              <Textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={5}
                placeholder="Escribe el mensaje..."
              />
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-2">Variables disponibles:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">{'{cliente}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{fecha}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{hora}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{servicio}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{profesional}'}</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAutomation(null)}>
              Cancelar
            </Button>
            <Button onClick={saveMessage}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
