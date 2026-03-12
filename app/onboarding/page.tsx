"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { updateBusinessSettings, updateAllBusinessHours } from "@/lib/actions/settings"
import { createCategory } from "@/lib/actions/categories"
import { createProfessional } from "@/lib/actions/professionals"
import { Sparkles, Loader2, Building2, Tag, User, CheckCircle2, ArrowRight, SkipForward, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = "business" | "hours" | "category" | "professional" | "done"
type ScheduleType = "corrido" | "cortado"

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "business", label: "Negocio", icon: Building2 },
  { id: "hours", label: "Horarios", icon: Clock },
  { id: "category", label: "Categoría", icon: Tag },
  { id: "professional", label: "Profesional", icon: User },
]

const DAYS = [
  { num: 1, short: "Lun" },
  { num: 2, short: "Mar" },
  { num: 3, short: "Mié" },
  { num: 4, short: "Jue" },
  { num: 5, short: "Vie" },
  { num: 6, short: "Sáb" },
  { num: 0, short: "Dom" },
]

function TimeInput({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("business")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1 - Business
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")

  // Step 2 - Hours
  const [scheduleType, setScheduleType] = useState<ScheduleType>("corrido")
  const [openTime, setOpenTime] = useState("09:00")
  const [closeTime, setCloseTime] = useState("19:00")
  const [breakStart, setBreakStart] = useState("13:00")
  const [breakEnd, setBreakEnd] = useState("15:00")
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5, 6]) // Lun-Sab

  // Step 3 - Category
  const [categoryName, setCategoryName] = useState("")
  const [categoryColor, setCategoryColor] = useState("#0F7A61")

  // Step 4 - Professional
  const [professionalName, setProfessionalName] = useState("")
  const [professionalPhone, setProfessionalPhone] = useState("")

  const currentStepIndex = STEPS.findIndex((s) => s.id === step)

  function toggleDay(dayNum: number) {
    setOpenDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    )
  }

  async function handleBusiness(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (address || phone) {
        await updateBusinessSettings({ address: address || undefined, phone: phone || undefined })
      }
      setStep("hours")
    } catch {
      setError("Error al guardar. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleHours(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await updateAllBusinessHours({
        openTime,
        closeTime,
        breakStartTime: scheduleType === "cortado" ? breakStart : null,
        breakEndTime: scheduleType === "cortado" ? breakEnd : null,
        openDays,
      })
      setStep("category")
    } catch {
      setError("Error al guardar los horarios.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCategory(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!categoryName.trim()) {
      setStep("professional")
      return
    }
    setLoading(true)
    try {
      await createCategory({ name: categoryName, color: categoryColor })
      setStep("professional")
    } catch {
      setError("Error al crear la categoría.")
    } finally {
      setLoading(false)
    }
  }

  async function handleProfessional(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!professionalName.trim()) {
      setStep("done")
      return
    }
    setLoading(true)
    try {
      await createProfessional({ name: professionalName, phone: professionalPhone || undefined })
      setStep("done")
    } catch {
      setError("Error al crear el profesional.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">¡Todo listo!</CardTitle>
            <CardDescription>
              Tu salon está configurado y listo para recibir turnos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Ir al panel <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Configuremos tu salon</h1>
          <p className="text-muted-foreground text-sm">Solo unos pasos y estarás listo</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentStepIndex
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card>
          {/* ── Paso 1: Negocio ── */}
          {step === "business" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Datos de tu negocio
                </CardTitle>
                <CardDescription>Completá la información de tu salon</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBusiness} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Teléfono del salon</Label>
                    <Input
                      id="biz-phone"
                      type="tel"
                      placeholder="+54 11 0000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setStep("hours")} title="Omitir">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* ── Paso 2: Horarios ── */}
          {step === "hours" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Horario de atención
                </CardTitle>
                <CardDescription>Configurá cuándo abre tu salon</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHours} className="space-y-5">

                  {/* Tipo de horario */}
                  <div className="space-y-2">
                    <Label>Tipo de horario</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setScheduleType("corrido")}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          scheduleType === "corrido"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="font-medium text-sm">Corrido</div>
                        <div className="text-xs text-muted-foreground mt-0.5">9:00 → 19:00</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleType("cortado")}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          scheduleType === "cortado"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="font-medium text-sm">Cortado</div>
                        <div className="text-xs text-muted-foreground mt-0.5">9:00–13:00 / 15:00–19:00</div>
                      </button>
                    </div>
                  </div>

                  {/* Horas según tipo */}
                  {scheduleType === "corrido" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <TimeInput id="openTime" label="Apertura" value={openTime} onChange={setOpenTime} />
                      <TimeInput id="closeTime" label="Cierre" value={closeTime} onChange={setCloseTime} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <TimeInput id="openTime" label="Apertura mañana" value={openTime} onChange={setOpenTime} />
                        <TimeInput id="breakStart" label="Cierre mañana" value={breakStart} onChange={setBreakStart} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TimeInput id="breakEnd" label="Apertura tarde" value={breakEnd} onChange={setBreakEnd} />
                        <TimeInput id="closeTime" label="Cierre tarde" value={closeTime} onChange={setCloseTime} />
                      </div>
                    </div>
                  )}

                  {/* Días */}
                  <div className="space-y-2">
                    <Label>Días que abre</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d) => (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleDay(d.num)}
                          className={cn(
                            "h-9 w-11 rounded-md text-xs font-medium border transition-colors",
                            openDays.includes(d.num)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                          )}
                        >
                          {d.short}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {scheduleType === "corrido"
                      ? `Horario: ${openTime} – ${closeTime}`
                      : `Mañana: ${openTime} – ${breakStart} · Tarde: ${breakEnd} – ${closeTime}`}
                    {" · "}
                    {openDays.length === 0
                      ? "Sin días seleccionados"
                      : DAYS.filter((d) => openDays.includes(d.num)).map((d) => d.short).join(", ")}
                  </div>

                  {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setStep("category")} title="Omitir">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* ── Paso 3: Categoría ── */}
          {step === "category" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Primera categoría
                </CardTitle>
                <CardDescription>Agrupá tus servicios por tipo, ej: Cabello, Manicura, Facial</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catName">Nombre de la categoría</Label>
                    <Input
                      id="catName"
                      placeholder="Ej: Cabello"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catColor">Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="catColor"
                        type="color"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
                      />
                      <Badge style={{ backgroundColor: categoryColor }} className="text-white">
                        {categoryName || "Vista previa"}
                      </Badge>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setStep("professional")} title="Omitir">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* ── Paso 4: Profesional ── */}
          {step === "professional" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Primer profesional
                </CardTitle>
                <CardDescription>Agregá a quien atiende los turnos</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfessional} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profName">Nombre</Label>
                    <Input
                      id="profName"
                      placeholder="Ej: María García"
                      value={professionalName}
                      onChange={(e) => setProfessionalName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profPhone">Teléfono</Label>
                    <Input
                      id="profPhone"
                      type="tel"
                      placeholder="+54 11 0000-0000"
                      value={professionalPhone}
                      onChange={(e) => setProfessionalPhone(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finalizar <CheckCircle2 className="ml-2 h-4 w-4" /></>}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setStep("done")} title="Omitir">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Podés editar todo esto luego desde Configuración
        </p>
      </div>
    </div>
  )
}
