"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, Save, Loader2, Coffee } from "lucide-react"
import { getBusinessHours, updateBusinessHour } from "@/lib/actions/settings"
import type { BusinessHourFrontend } from "@/lib/actions/settings"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

export default function HoursPage() {
  const { toast } = useToast()
  const [hours, setHours] = useState<BusinessHourFrontend[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getBusinessHours().then((data) => {
      setHours(data)
      setLoading(false)
    })
  }, [])

  const updateHour = (
    dayOfWeek: number,
    field: keyof BusinessHourFrontend,
    value: string | boolean | undefined
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    )
    setHasChanges(true)
  }

  const toggleSplit = (dayOfWeek: number, isSplit: boolean) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek
          ? {
              ...h,
              breakStartTime: isSplit ? (h.breakStartTime ?? "13:00") : undefined,
              breakEndTime: isSplit ? (h.breakEndTime ?? "15:00") : undefined,
            }
          : h
      )
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        hours.map((h) =>
          updateBusinessHour(h.dayOfWeek, {
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
            breakStartTime: h.breakStartTime ?? null,
            breakEndTime: h.breakEndTime ?? null,
          })
        )
      )
      setHasChanges(false)
      toast({ title: "Horarios guardados" })
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header
        title="Horarios de atencion"
        subtitle="Configura los horarios de apertura del salon"
        showNewAppointment={false}
      />

      <main className="flex-1 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Horarios semanales</CardTitle>
                <CardDescription>
                  Configura apertura, cierre y si el horario es corrido o cortado (con pausa al mediodia)
                </CardDescription>
              </div>
              {hasChanges && (
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {hours.map((dayHours) => {
                  const isSplit = !!(dayHours.breakStartTime && dayHours.breakEndTime)
                  return (
                    <div
                      key={dayHours.dayOfWeek}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        dayHours.isClosed && "opacity-60 bg-muted/30"
                      )}
                    >
                      {/* Row 1: toggle + day name + corrido/cortado toggle */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-[130px]">
                          <Switch
                            checked={!dayHours.isClosed}
                            onCheckedChange={(checked) => updateHour(dayHours.dayOfWeek, "isClosed", !checked)}
                          />
                          <span className={cn("font-medium", dayHours.isClosed && "text-muted-foreground")}>
                            {dayNames[dayHours.dayOfWeek]}
                          </span>
                        </div>

                        {!dayHours.isClosed && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Corrido</span>
                            <Switch
                              checked={isSplit}
                              onCheckedChange={(checked) => toggleSplit(dayHours.dayOfWeek, checked)}
                            />
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Coffee className="h-3 w-3" />
                              Cortado
                            </span>
                            {isSplit && (
                              <Badge variant="secondary" className="text-xs">con pausa</Badge>
                            )}
                          </div>
                        )}

                        {dayHours.isClosed && (
                          <span className="text-sm text-muted-foreground italic">Cerrado</span>
                        )}
                      </div>

                      {/* Row 2: time inputs */}
                      {!dayHours.isClosed && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {/* Open/Close */}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Apertura</span>
                            <Input
                              type="time"
                              value={dayHours.openTime || "09:00"}
                              onChange={(e) => updateHour(dayHours.dayOfWeek, "openTime", e.target.value)}
                              className="w-28"
                            />
                          </div>
                          <span className="text-muted-foreground">–</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Cierre</span>
                            <Input
                              type="time"
                              value={dayHours.closeTime || "18:00"}
                              onChange={(e) => updateHour(dayHours.dayOfWeek, "closeTime", e.target.value)}
                              className="w-28"
                            />
                          </div>

                          {/* Break times (cortado) */}
                          {isSplit && (
                            <>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-700">pausa</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Coffee className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-muted-foreground">Inicio</span>
                                <Input
                                  type="time"
                                  value={dayHours.breakStartTime || "13:00"}
                                  onChange={(e) => updateHour(dayHours.dayOfWeek, "breakStartTime", e.target.value)}
                                  className="w-28 border-orange-200 focus:border-orange-400"
                                />
                              </div>
                              <span className="text-muted-foreground">–</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Fin</span>
                                <Input
                                  type="time"
                                  value={dayHours.breakEndTime || "15:00"}
                                  onChange={(e) => updateHour(dayHours.dayOfWeek, "breakEndTime", e.target.value)}
                                  className="w-28 border-orange-200 focus:border-orange-400"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
