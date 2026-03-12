"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Users,
  Scissors,
  Clock,
  MessageSquare,
  Settings,
  LayoutDashboard,
  CalendarDays,
  FolderOpen,
  Sparkles,
  Zap,
  ChevronDown,
  LogOut,
  Package,
  Tag,
} from "lucide-react"
import { logoutAction } from "@/lib/actions/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { title: "Citas", href: "/dashboard/appointments", icon: CalendarDays },
]

const managementNavItems = [
  { title: "Clientes", href: "/dashboard/clients", icon: Users },
  { title: "Profesionales", href: "/dashboard/professionals", icon: Scissors },
  { title: "Categorias", href: "/dashboard/categories", icon: FolderOpen },
  { title: "Servicios", href: "/dashboard/services", icon: Sparkles },
  { title: "Productos", href: "/dashboard/products", icon: Package },
  { title: "Promociones", href: "/dashboard/promotions", icon: Tag },
]

const settingsNavItems = [
  { title: "Horarios", href: "/dashboard/hours", icon: Clock },
  { title: "Configuracion", href: "/dashboard/settings", icon: Settings },
]

export function AppSidebar({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo_3d.png"
            alt="Bella"
            width={52}
            height={52}
            className="rounded-3xl shadow-lg bg-gray-300"
          />
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-white">Bella</span>
            <span className="text-xs text-white/60">Salon Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-medium px-3 mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="h-10 px-3 text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-white/50 text-xs font-medium px-3 mb-2">
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="h-10 px-3 text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-white/50 text-xs font-medium px-3 mb-2">
            Configuracion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="h-10 px-3 text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white/10 text-white text-sm">
                  {userName ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium">{userName || "Usuario"}</span>
                <span className="text-xs text-white/50 truncate max-w-[120px]">{userEmail || ""}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Configuracion del salon</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => logoutAction()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
