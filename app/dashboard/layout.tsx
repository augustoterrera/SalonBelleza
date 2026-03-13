export const dynamic = 'force-dynamic'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { getSession } from "@/lib/session"
import { getBusinessSettings } from "@/lib/actions/settings"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, settings] = await Promise.all([getSession(), getBusinessSettings()])

  return (
    <SidebarProvider>
      <AppSidebar userName={session?.name} userEmail={session?.email} tenantName={settings?.name} />
      <SidebarInset className="bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
