"use client"

import { useState } from "react"
import Link from "next/link"
import { registerAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { Loader2 } from "lucide-react"

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (UTC-3)" },
  { value: "America/Santiago", label: "Chile (UTC-4/-3)" },
  { value: "America/Bogota", label: "Colombia (UTC-5)" },
  { value: "America/Lima", label: "Perú (UTC-5)" },
  { value: "America/Mexico_City", label: "México (UTC-6/-5)" },
  { value: "America/Caracas", label: "Venezuela (UTC-4)" },
  { value: "America/Montevideo", label: "Uruguay (UTC-3)" },
  { value: "America/La_Paz", label: "Bolivia (UTC-4)" },
  { value: "America/Asuncion", label: "Paraguay (UTC-4/-3)" },
  { value: "America/Guayaquil", label: "Ecuador (UTC-5)" },
  { value: "America/Sao_Paulo", label: "Brasil São Paulo (UTC-3)" },
  { value: "Europe/Madrid", label: "España (UTC+1/+2)" },
]

export default function RegisterPage() {
  const [salonName, setSalonName] = useState("")
  const [phone, setPhone] = useState("")
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const result = await registerAction({ salonName, name, email, password, phone, timezone })
      if (result?.error) setError(result.error)
    } catch {
      // redirect() throws — means registration was successful
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <Image
        src="/logo_3d.png"
        alt="Bella"
        width={120}
        height={120}
        className="mb-4 drop-shadow-xl"
        priority
      />
    <Card className="w-full">
      <CardHeader className="text-center space-y-1 pb-4">
        <CardTitle className="text-2xl">Registrá tu salon</CardTitle>
        <CardDescription>Crea tu cuenta y empezá a gestionar tu negocio</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salonName">Nombre del salon</Label>
            <Input
              id="salonName"
              placeholder="Ej: Salon Belleza"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 11 0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name">Tu nombre</Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta gratis"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Ingresá acá
          </Link>
        </p>
      </CardContent>
    </Card>
    </div>
  )
}
