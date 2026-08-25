import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Obtenemos las cookies de sesión y de rol
  const sessionCookie = request.cookies.get('sb-sindicato-session')?.value;
  const rolCookie = request.cookies.get('sb-sindicato-rol')?.value;
  
  const pathname = request.nextUrl.pathname;

  // 2. Identificamos en qué zona está intentando navegar el usuario
  const isLogin = pathname === '/';
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');

  // ----------------------------------------------------------------------
  // 🛡️ GUARDIÁN 1: Autenticación (No sesión = No entra al sistema)
  // ----------------------------------------------------------------------
  if ((isDashboard || isAdmin) && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ----------------------------------------------------------------------
  // 🛡️ GUARDIÁN 2: Flujo Lógico (Si ya tiene sesión, no mostrar el login)
  // ----------------------------------------------------------------------
  if (isLogin && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ----------------------------------------------------------------------
  // 🛡️ GUARDIÁN 3: Roles y Permisos (Solo Administradores entran a /admin)
  // ----------------------------------------------------------------------
  if (isAdmin && rolCookie !== 'Administrador') {
    // Si un socio normal intenta entrar al panel admin, lo devolvemos al inicio
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si pasa todos los guardianes, le permitimos cargar la página
  return NextResponse.next();
}

export const config = {
  // Optimizamos el matcher para que no se ejecute innecesariamente en las APIs ni archivos estáticos
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}