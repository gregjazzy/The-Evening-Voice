import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Locales supportées
const locales = ['fr', 'en', 'ru'] as const
const defaultLocale = 'fr'

// Routes publiques (pas besoin d'auth) - chemins localisés
const publicPaths = [
  '/connexion', '/login', '/вход',
  '/inscription', '/register', '/регистрация',
  '/auth/callback', '/auth/confirm',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ne pas traiter les assets statiques et API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Extraire la locale du pathname
  const segments = pathname.split('/')
  const possibleLocale = segments[1]
  const hasLocalePrefix = locales.includes(possibleLocale as any)
  
  // Si pas de locale dans l'URL, rediriger vers la locale par défaut
  if (!hasLocalePrefix && pathname !== '/') {
    const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url)
    return NextResponse.redirect(newUrl)
  }

  // Si c'est la racine, rediriger vers la locale par défaut
  if (pathname === '/') {
    // Essayer de détecter la langue du navigateur
    const acceptLanguage = request.headers.get('accept-language') || ''
    let detectedLocale = defaultLocale
    
    for (const locale of locales) {
      if (acceptLanguage.toLowerCase().includes(locale)) {
        detectedLocale = locale
        break
      }
    }
    
    return NextResponse.redirect(new URL(`/${detectedLocale}`, request.url))
  }

  const locale = hasLocalePrefix ? possibleLocale : defaultLocale
  const pathnameWithoutLocale = hasLocalePrefix 
    ? '/' + segments.slice(2).join('/') 
    : pathname

  // Créer la réponse avec le header de locale
  const response = NextResponse.next()

  // Créer le client Supabase pour vérifier l'auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Utiliser getSession() au lieu de getUser() pour une vérification plus permissive
  // getUser() fait une requête API qui peut échouer si les cookies ne sont pas bien transmis
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Vérifier si c'est une route publique (login/register uniquement)
  const isPublicRoute = publicPaths.some(p => 
    pathnameWithoutLocale === p || 
    pathnameWithoutLocale.startsWith(p + '/')
  )

  // Si sur login/register et déjà connecté, rediriger vers home
  if (user && publicPaths.some(p => pathnameWithoutLocale === p)) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // Si route protégée et pas connecté, rediriger vers login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
