import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionToken } from "@/lib/session"

const PUBLIC_PATHS = ["/login", "/register", "/api/seed"]
const PROTECTED_PATHS = ["/dashboard", "/onboarding"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Protect /dashboard and /onboarding
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("salon-session")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const session = await verifySessionToken(token)
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/onboarding", "/login", "/register"],
}
