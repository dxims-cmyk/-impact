import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-memory rate limiting for middleware (per edge isolate)
const MAX_MAP_SIZE = 10000
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}

function checkRateLimit(ip: string, limit: number = 100): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window

  const entry = rateLimitMap.get(ip)

  if (!entry || entry.resetAt < now) {
    // Prevent unbounded growth — evict expired entries if map is large
    if (rateLimitMap.size >= MAX_MAP_SIZE) {
      cleanupExpired()
      // If still too large after cleanup, clear everything (safe — just resets limits)
      if (rateLimitMap.size >= MAX_MAP_SIZE) {
        rateLimitMap.clear()
      }
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

export async function middleware(request: NextRequest) {
  // Get client IP for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || 'unknown'

  // Apply stricter rate limits to API routes
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const limit = isApiRoute ? 100 : 200 // 100/min for API, 200/min for pages

  // Check rate limit
  if (!checkRateLimit(ip, limit)) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // Marketing / public routes that never need auth or Supabase
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify', '/offline', '/book', '/form', '/auth/callback', '/auth/confirm', '/terms', '/privacy', '/demo', '/welcome']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isMarketingHome = request.nextUrl.pathname === '/'

  // API routes that don't require auth
  const publicApiRoutes = ['/api/webhooks', '/api/auth', '/api/embed', '/api/health']
  const isPublicApi = publicApiRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Allow marketing pages and public routes without touching Supabase
  if (isMarketingHome || isPublicRoute || isPublicApi) {
    const res = NextResponse.next({ request: { headers: request.headers } })
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return res
  }

  // Everything below requires Supabase — bail gracefully if env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session) {
    // For API routes, return 401 instead of redirect
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
