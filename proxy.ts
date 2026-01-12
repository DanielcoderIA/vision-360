import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 🛡️ PROXY / MIDDLEWARE DE AUTENTICACIÓN
 * Optimizado para Next.js 16.1.0 (Turbopack)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Creamos la respuesta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. ⚡ EXCEPCIÓN CRÍTICA: Si es la página de login o archivos estáticos,
  // permitimos el paso libre sin inicializar Supabase. Esto rompe el bucle 303.
  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/_next') || 
    pathname.includes('.')
  ) {
    return response
  }

  // 3. Configuramos el cliente de Supabase solo para rutas protegidas
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Sincronizamos cookies con la petición y la respuesta
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 4. Verificamos la identidad del usuario
  const { data: { user } } = await supabase.auth.getUser()

  // 5. Redirección de seguridad: Si no hay sesión, mandamos a login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

// 6. ⚙️ MATCHER: Define qué rutas pasan por este archivo
export const config = {
  matcher: [
    /*
     * Protege todas las rutas excepto:
     * - api (rutas internas)
     * - _next/static, _next/image (estilos y fotos)
     * - favicon.ico e imágenes comunes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}